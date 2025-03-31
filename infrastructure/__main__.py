"""A Python Pulumi program"""

import pulumi
import pulumi_aws as aws

config = pulumi.Config()
zone_name = config.require("zone_name")


zone = aws.route53.get_zone(name=zone_name)

docs_bucket = aws.s3.Bucket(f"docs.{zone_name}",
    bucket=f"docs.{zone_name}",
    tags={
        "Environment": "dev",
        "Project": "static-site",
    },
    website={
        "indexDocument": "index.html",
        "errorDocument": "error.html",
    },
)

origin_access_identity = aws.cloudfront.OriginAccessIdentity("docs-oai",
    comment=f"OAI for docs.{zone_name}"
)

bucket_policy = aws.s3.BucketPolicy("docs-bucket-policy",
    bucket=docs_bucket.id,
    policy=pulumi.Output.all(docs_bucket.arn, origin_access_identity.iam_arn).apply(
        lambda args: f'''{{
            "Version": "2012-10-17",
            "Statement": [{{
                "Effect": "Allow",
                "Principal": {{"AWS": "{args[1]}"}},
                "Action": "s3:GetObject",
                "Resource": "{args[0]}/*"
            }}]
        }}'''
    )
)

certificate = aws.acm.Certificate("docs-cert",
    domain_name=f"docs.{zone_name}",
    validation_method="DNS",
    tags={
        "Environment": "dev",
        "Project": "static-site",
    },
)

validation_record = aws.route53.Record("docs-cert-validation",
    zone_id=zone.zone_id,
    name=certificate.domain_validation_options[0].resource_record_name,
    type=certificate.domain_validation_options[0].resource_record_type,
    records=[certificate.domain_validation_options[0].resource_record_value],
    ttl=60,
)

certificate_validation = aws.acm.CertificateValidation("docs-cert-validation",
    certificate_arn=certificate.arn,
    validation_record_fqdns=[validation_record.fqdn],
)

distribution = aws.cloudfront.Distribution("docs-distribution",
    origins=[aws.cloudfront.DistributionOriginArgs(
        domain_name=docs_bucket.bucket_regional_domain_name,
        origin_id=f"S3-docs.{zone_name}",
        s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
            origin_access_identity=origin_access_identity.cloudfront_access_identity_path,
        ),
    )],
    enabled=True,
    is_ipv6_enabled=True,
    default_root_object="index.html",
    aliases=[f"docs.{zone_name}"],
    default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
        allowed_methods=["GET", "HEAD", "OPTIONS"],
        cached_methods=["GET", "HEAD"],
        target_origin_id=f"S3-docs.{zone_name}",
        forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
            query_string=False,
            cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                forward="none",
            ),
        ),
        viewer_protocol_policy="redirect-to-https",
        min_ttl=0,
        default_ttl=3600,
        max_ttl=86400,
    ),
    price_class="PriceClass_100",
    restrictions=aws.cloudfront.DistributionRestrictionsArgs(
        geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
            restriction_type="none",
        ),
    ),
    viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
        acm_certificate_arn=certificate_validation.certificate_arn,
        ssl_support_method="sni-only",
        minimum_protocol_version="TLSv1.2_2021",
    ),
    tags={
        "Environment": "dev",
        "Project": "static-site",
    },
)

docs_record = aws.route53.Record(f"docs.{zone_name}",
    name=f"docs.{zone_name}",
    zone_id=zone.zone_id,
    type="A",
    aliases=[aws.route53.RecordAliasArgs(
        name=distribution.domain_name,
        zone_id=distribution.hosted_zone_id,
        evaluate_target_health=False,
    )],
)

pulumi.export("website_url", pulumi.Output.concat("https://", docs_record.name))
pulumi.export("cloudfront_domain", distribution.domain_name)
pulumi.export("bucket_name", docs_bucket.id)
    