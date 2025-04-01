"use strict";

const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

const config = new pulumi.Config();
const zoneName = config.require("zone_name");

const zone = aws.route53.getZone({ name: zoneName });

const docsBucket = new aws.s3.Bucket(`docs.${zoneName}`, {
    bucket: `docs.${zoneName}`,
    tags: {
        "Environment": "dev",
        "Project": "static-site",
    },
    website: {
        indexDocument: "index.html",
        errorDocument: "error.html",
    },
});

const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity("docs-oai", {
    comment: `OAI for docs.${zoneName}`
});

const bucketPolicy = new aws.s3.BucketPolicy("docs-bucket-policy", {
    bucket: docsBucket.id,
    policy: pulumi.all([docsBucket.arn, originAccessIdentity.iamArn])
        .apply(([bucketArn, oaiIamArn]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: { AWS: oaiIamArn },
                Action: "s3:GetObject",
                Resource: `${bucketArn}/*`
            }]
        }))
});

const certificate = new aws.acm.Certificate("docs-cert", {
    domainName: `docs.${zoneName}`,
    validationMethod: "DNS",
    tags: {
        "Environment": "dev",
        "Project": "static-site",
    },
});

const validationRecord = new aws.route53.Record("docs-cert-validation", {
    zoneId: zone.then(z => z.zoneId),
    name: certificate.domainValidationOptions[0].resourceRecordName,
    type: certificate.domainValidationOptions[0].resourceRecordType,
    records: [certificate.domainValidationOptions[0].resourceRecordValue],
    ttl: 60,
});

const certificateValidation = new aws.acm.CertificateValidation("docs-cert-validation", {
    certificateArn: certificate.arn,
    validationRecordFqdns: [validationRecord.fqdn],
});

const distribution = new aws.cloudfront.Distribution("docs-distribution", {
    origins: [{
        domainName: docsBucket.bucketRegionalDomainName,
        originId: `S3-docs.${zoneName}`,
        s3OriginConfig: {
            originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
        },
    }],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    aliases: [`docs.${zoneName}`],
    defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: `S3-docs.${zoneName}`,
        forwardedValues: {
            queryString: false,
            cookies: {
                forward: "none",
            },
        },
        viewerProtocolPolicy: "redirect-to-https",
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
    },
    priceClass: "PriceClass_100",
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    viewerCertificate: {
        acmCertificateArn: certificateValidation.certificateArn,
        sslSupportMethod: "sni-only",
        minimumProtocolVersion: "TLSv1.2_2021",
    },
    tags: {
        "Environment": "dev",
        "Project": "static-site",
    },
});

const docsRecord = new aws.route53.Record(`docs.${zoneName}`, {
    name: `docs.${zoneName}`,
    zoneId: zone.then(z => z.zoneId),
    type: "A",
    aliases: [{
        name: distribution.domainName,
        zoneId: distribution.hostedZoneId,
        evaluateTargetHealth: false,
    }],
});

exports.websiteUrl = pulumi.interpolate`https://${docsRecord.name}`;
exports.cloudfrontDomain = distribution.domainName;
exports.bucketName = docsBucket.id;