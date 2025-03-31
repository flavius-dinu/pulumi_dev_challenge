---
sidebar_position: 2
---

# Monitoring and Observability

Learn how to implement **monitoring and observability** in your DevOps practice to gain insights into your systems.

## The Three Pillars of Observability

Observability consists of three main components:

1. **Metrics**: Numerical data points collected over time
2. **Logs**: Detailed records of events that occurred in your system
3. **Traces**: Information about request flows through distributed systems

## Setting Up Prometheus for Metrics

Install Prometheus using Docker:

```bash
docker run -d --name prometheus -p 9090:9090 -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

Configure Prometheus to scrape metrics from your services:

```yaml title="prometheus.yml"
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-service'
    static_configs:
      - targets: ['api:8080']
  
  - job_name: 'database-service'
    static_configs:
      - targets: ['db:9187']
```

## Visualizing Metrics with Grafana

Set up Grafana to visualize your metrics:

```bash
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

Create a dashboard to monitor key metrics:

```json title="dashboard.json"
{
  "panels": [
    {
      "title": "API Request Rate",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{path}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
          "legendFormat": "{{method}} {{path}}"
        }
      ]
    }
  ]
}
```

## Centralized Logging with ELK Stack

Set up the ELK (Elasticsearch, Logstash, Kibana) stack:

```yaml title="docker-compose.yml"
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.10.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
  
  logstash:
    image: docker.elastic.co/logstash/logstash:7.10.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
  
  kibana:
    image: docker.elastic.co/kibana/kibana:7.10.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

Configure Logstash to process your logs:

```conf title="logstash.conf"
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  if [level] == "ERROR" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

## Distributed Tracing with Jaeger

Set up Jaeger for distributed tracing:

```bash
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 14250:14250 \
  -p 9411:9411 \
  jaegertracing/all-in-one:1.21
```

Instrument your application to send traces to Jaeger:

```javascript title="app.js"
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

const provider = new NodeTracerProvider();

const exporter = new JaegerExporter({
  serviceName: 'my-service',
  endpoint: 'http://jaeger:14268/api/traces',
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

registerInstrumentations({
  instrumentations: [
    new ExpressInstrumentation(),
  ],
});
```

Access the Jaeger UI at [http://localhost:16686](http://localhost:16686) to view and analyze traces.
