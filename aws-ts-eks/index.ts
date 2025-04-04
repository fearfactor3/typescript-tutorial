import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

const name = "hello-world";

// Create an EKS cluster with non-default configuration
const vpc = new awsx.ec2.Vpc("vpc", {numberOfAvailabilityZones: 2});

const cluster = new eks.Cluster(name, {
    vpcId: vpc.vpcId,
    subnetIds: vpc.publicSubnetIds,
    authenticationMode: eks.AuthenticationMode.Api,
    desiredCapacity: 2,
    minSize: 1,
    maxSize: 2,
    storageClasses: "gp2",
});

// Export the kubeconfig
export const kubeconfig = cluster.kubeconfig;

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, { provider: cluster.provider });

// Export the Namespace name
export const namespace = ns.metadata.name;

// Create a NGINX Deployment
const appLabels = { appClass: name };
const deployment = new k8s.apps.v1.Deployment(name,
    {
        metadata: {
            namespace: ns.metadata.name,
            labels: appLabels,
        },
        spec: {
            replicas: 1,
            selector: { matchLabels: appLabels },
            template: {
                metadata: { 
                    labels: appLabels 
                },
                spec: {
                    containers: [
                        {
                            name: name,
                            image: "nginx:latest",
                            ports: [{ name: "http", containerPort: 80}],
                        },
                    ],
                },
            },
        },
    },
    { 
        provider: cluster.provider 
    },
);


// Export the Deployment name
export const deploymentName = deployment.metadata.name;

// Create a LoadBalancer Service for the NGINX Deployment
const service = new k8s.core.v1.Service(name, 
    {
        metadata: {
            labels: appLabels,
            namespace: namespace,
        },
        spec: {
            type: "LoadBalancer",
            ports: [{ port: 80, targetPort: "http" }],
            selector: appLabels,
        },
    },
    {
        provider: cluster.provider,
    },
);

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.name;
export const publicEndpoint = service.status.loadBalancer.ingress[0].hostname;
