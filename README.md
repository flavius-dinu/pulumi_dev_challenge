# Deploying a static website with Pulumi and Spacelift

## Static site

This is a documentation website built with Docusaurus, a modern static website generator optimized for documentation sites with built-in support for blogs and tutorials.

Prerequisites:
- Node.js 18 or higher
- npm or yarn

To install the dependencies, run:

```bash
npm install
```
To start the development server, run:

```bash
npm start
```

This will start a local development server at http://localhost:3000.


## Create the State Bucket
In your AWS account, you should create your state bucket.



### Set up a VCS integration in Spacelift
Go to source code and select:


![Create VCS Integration](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jescnb7s2byaxcf2i49t.png)


Next, set it up via the Wizard:

![VCS Wizard Set Up](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qhm92syb712tyndnzloo.png)

Follow the steps from there and in the end you will result in:

![Created VCS Integration](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fwgzdiunzyp9754ombyo.png)

Click on install application and then install it in GitHub:
![Install GitHub Application](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/t93lmcrqvvv1w010vu8r.png)


### Set up a Cloud Integration in Spacelift

To easily leverage dynamic credentials in Spacelift, we can take advantage of Cloud Integrations. To build this native integration, you would need to go to Cloud Integrations -> Set up Cloud Integration -> AWS:


![Spacelift Cloud Integration](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/svoo9y51r9ftjarvzyr3.png)

In parallel, go to AWS and create a new role by selecting a custom trust policy:


![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5hamqqilqd16xlze3d54.png)

Next, add the required permissions for creating the Pulumi resources:
- s3:*
- acm:*
- route53:*
- cloudfront:*

Of course, you could be more granular with the permissions, but because this is my account and I am the only one using it, I can easily give full permissions for these resources.

In the end, add a name for your role, and an optional description as presented here:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zuvwmawndx069agqzgca.png)

After you create the role, select it, and copy the ARN. We are now ready to go back to our Spacelift account and continue the creation of the cloud integration, by pasting the ARN inside the configuration form. In the end, it should look like this:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d9pztd143clbcie7zhbp.png)



### Deploying with Spacelift




