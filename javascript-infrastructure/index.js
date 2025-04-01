"use strict";

const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

const config = new pulumi.Config();
const zoneName = config.require("zone_name");

const zone = aws.route53.getZone({ name: zoneName });

const docsjsBucket = new aws.s3.Bucket(`docsjs.${zoneName}`, {
    bucket: `docsjs.${zoneName}`,
    tags: {
        "Environment": "dev",
        "Project": "static-site",
    },
    website: {
        indexDocument: "index.html",
        errorDocument: "error.html",
    },
});

const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity("docsjs-oai", {
    comment: `OAI for docsjs.${zoneName}`
});

const bucketPolicy = new aws.s3.BucketPolicy("docsjs-bucket-policy", {
    bucket: docsjsBucket.id,
    policy: pulumi.all([docsjsBucket.arn, originAccessIdentity.iamArn])
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

const certificate = new aws.acm.Certificate("docsjs-cert", {
    domainName: `docsjs.${zoneName}`,
    validationMethod: "DNS",
    tags: {
        "Environment": "dev",
        "Project": "static-site",
    },
});

const validationRecord = new aws.route53.Record("docsjs-cert-validation", {
    zoneId: zone.then(z => z.zoneId),
    name: certificate.domainValidationOptions[0].resourceRecordName,
    type: certificate.domainValidationOptions[0].resourceRecordType,
    records: [certificate.domainValidationOptions[0].resourceRecordValue],
    ttl: 60,
});

const certificateValidation = new aws.acm.CertificateValidation("docsjs-cert-validation", {
    certificateArn: certificate.arn,
    validationRecordFqdns: [validationRecord.fqdn],
});

const distribution = new aws.cloudfront.Distribution("docsjs-distribution", {
    origins: [{
        domainName: docsjsBucket.bucketRegionalDomainName,
        originId: `S3-docsjs.${zoneName}`,
        s3OriginConfig: {
            originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
        },
    }],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    aliases: [`docsjs.${zoneName}`],
    defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: `S3-docsjs.${zoneName}`,
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

const docsjsRecord = new aws.route53.Record(`docsjs.${zoneName}`, {
    name: `docsjs.${zoneName}`,
    zoneId: zone.then(z => z.zoneId),
    type: "A",
    aliases: [{
        name: distribution.domainName,
        zoneId: distribution.hostedZoneId,
        evaluateTargetHealth: false,
    }],
});

exports.websiteUrl = pulumi.interpolate`https://${docsjsRecord.name}`;
exports.cloudfrontDomain = distribution.domainName;
exports.bucketName = docsjsBucket.id;