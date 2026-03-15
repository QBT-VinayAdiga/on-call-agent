export const EXAMPLES = [
  {
    label: 'Checkout Latency',
    icon: '🛒',
    text: `ALERTS:
- CheckoutLatencyHigh: 4500ms (threshold: 1000ms) fired at 2026-03-15T14:03:00Z
- CheckoutErrorRateHigh: 15.4% (threshold: 5%) fired at 2026-03-15T14:05:00Z

LOGS:
[2026-03-15T14:04:00Z] ERROR checkout-api: upstream service timeout connecting to inventory-db-01
[2026-03-15T14:04:05Z] WARN checkout-api: retrying connection to inventory-db-01 (attempt 3/3)
[2026-03-15T14:04:10Z] ERROR checkout-api: circuit breaker opened for inventory-service

METRICS:
- inventory_db_connection_pool_usage: 100%
- inventory_db_cpu_utilization: 92%`
  },
  {
    label: 'Database Timeout',
    icon: '🗄️',
    text: `CRITICAL ALERT: DBConnectionTimeout on production-cluster-01
Fired: 2 mins ago
Service: user-profile-service
Region: us-east-1

STACK TRACE:
Internal Server Error: Failed to acquire connection from pool 'default' after 30000ms.
  at com.zaxxer.hikari.pool.PoolBase.getConnection(PoolBase.java:162)
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:145)

RECENT CHANGES:
- Deployment 'v1.4.2-hotfix-3' pushed to user-profile-service (10 mins ago)
- Migration '20260315_add_index_to_profiles' started (15 mins ago)`
  },
  {
    label: 'API 500 Spike',
    icon: '🌐',
    text: `High 5xx Error Rate on Load Balancer 'prod-ext-lb'
Current: 25.5 req/s
Target: < 0.5 req/s

UPSTREAM LOGS (gateway-api):
[ERROR] 502 Bad Gateway - POST /v1/auth/login
[ERROR] 502 Bad Gateway - GET /v1/user/settings
[WARN] upstream 'auth-service' unreachable, timing out after 5s

K8S EVENTS:
- auth-service-67fbd-92x1: CrashLoopBackOff (12 restarts in 5m)
- auth-service-67fbd-92x1: Liveness probe failed: HTTP probe failed with statuscode: 500`
  },
  {
    label: 'Simple Alert',
    icon: '🚨',
    text: JSON.stringify({
      "incident_id": "INC-20260217-001",
      "title": "API Gateway 5xx spike on payments endpoint",
      "severity": "SEV3",
      "timeframe": { "start": "2026-02-17T03:42:00Z" },
      "alerts": [
        { "name": "HighErrorRate-payments-api", "description": "5xx error rate exceeded 5% threshold on /v1/payments for 5 consecutive minutes.", "timestamp": "2026-02-17T03:42:00Z" }
      ],
      "metrics": [ { "name": "http_5xx_rate", "window": "5m", "values_summary": "Jumped from 0.2% to 8.3% at 03:42Z" } ],
      "runbook_excerpt": "Step 1: Check API Gateway health dashboard. Step 2: Verify downstream service connectivity."
    }, null, 2)
  },
  {
    label: 'Multi-Signal',
    icon: '📊',
    text: JSON.stringify({
      "incident_id": "INC-20260217-002",
      "title": "Order processing latency degradation with database connection pool exhaustion",
      "severity": "SEV1",
      "timeframe": { "start": "2026-02-17T01:15:00Z", "end": "2026-02-17T02:45:00Z" },
      "alerts": [
        { "name": "HighLatency-order-service", "description": "P99 latency for order-service exceeded 5s (threshold: 2s) for 10 minutes.", "timestamp": "2026-02-17T01:15:00Z" },
        { "name": "DBConnectionPoolExhausted-orders-db", "description": "Connection pool utilization at 100% on orders-db-primary replica.", "timestamp": "2026-02-17T01:18:00Z" },
        { "name": "PodRestarts-order-worker", "description": "order-worker pods restarting with OOMKilled in namespace prod-orders.", "timestamp": "2026-02-17T01:22:00Z" }
      ],
      "logs": [
        { "source": "order-service", "lines": [ "2026-02-17T01:16:32Z ERROR Failed to acquire DB connection within 30s timeout", "2026-02-17T01:20:45Z INFO  Circuit breaker OPEN for orders-db-primary" ] },
        { "source": "order-worker", "lines": [ "2026-02-17T01:19:00Z ERROR java.lang.OutOfMemoryError: Java heap space" ] }
      ],
      "metrics": [
        { "name": "order_service_p99_latency_ms", "window": "15m", "values_summary": "Baseline 800ms, rose to 12,400ms at 01:20Z" },
        { "name": "db_connection_pool_utilization_pct", "window": "15m", "values_summary": "Climbed from 60% to 100% between 01:10Z and 01:18Z" }
      ],
      "runbook_excerpt": "Step 1: Verify DB primary health. Step 2: Scale connection pool. Step 3: Restart order-worker pods if OOMKilled."
    }, null, 2)
  },
  {
    label: 'Post-Incident',
    icon: '📝',
    text: JSON.stringify({
      "incident_id": "INC-20260216-099",
      "title": "Completed: Authentication service outage caused by expired TLS certificate",
      "severity": "SEV1",
      "timeframe": { "start": "2026-02-16T14:00:00Z", "end": "2026-02-16T16:35:00Z" },
      "alerts": [
        { "name": "AuthFailureRate-Critical", "description": "Authentication success rate dropped below 10% across all regions.", "timestamp": "2026-02-16T14:02:00Z" },
        { "name": "IncidentResolved-Auth", "description": "Authentication success rate recovered to 99.8%.", "timestamp": "2026-02-16T16:35:00Z" }
      ],
      "logs": [
        { "source": "auth-service", "lines": [ "2026-02-16T14:00:45Z ERROR TLS certificate expired for *.auth.contoso.com", "2026-02-16T15:30:00Z INFO  New certificate deployed to auth-lb-primary", "2026-02-16T16:35:00Z INFO  Auth success rate nominal (99.8%)" ] }
      ],
      "metrics": [
        { "name": "auth_success_rate_pct", "window": "5m", "values_summary": "Dropped from 99.9% to 2% at 14:01Z, recovered to 99.8% at 16:35Z" }
      ],
      "runbook_excerpt": "Step 1: Identify expired cert. Step 2: Issue emergency replacement. Step 3: Deploy to LB and edge nodes."
    }, null, 2)
  },
  {
    label: 'Redis Outage',
    icon: '🧊',
    text: JSON.stringify({
      "incident_id": "INC-2026-0401",
      "title": "Redis cache cluster unresponsive – session service returning 503s",
      "severity": "SEV2",
      "timeframe": { "start": "2026-02-17T06:30:00Z" },
      "alerts": [
        { "name": "RedisCluster-Unreachable", "description": "Redis sentinel reports master node unreachable for >60s.", "timestamp": "2026-02-17T06:30:15Z" }
      ],
      "logs": [
        { "source": "redis-sentinel", "lines": [ "2026-02-17T06:29:55Z WARN  Master node redis-master-0 not responding to PING", "2026-02-17T06:30:10Z ERROR Failover triggered: promoting redis-replica-2" ] }
      ],
      "runbook_excerpt": "Step 1: Check Redis Sentinel status. Step 2: Manually trigger failover."
    }, null, 2)
  },
  {
    label: 'AKS Scaling',
    icon: '🚀',
    text: JSON.stringify({
      "incident_id": "INC-2026-0402",
      "title": "Kubernetes node pool scaling failure causing pod scheduling backlog",
      "severity": "SEV1",
      "timeframe": { "start": "2026-02-17T09:00:00Z" },
      "alerts": [
        { "name": "AKS-NodePool-ScaleFailure", "description": "Node pool 'workload-pool' failed to scale. VMSS error: InsufficientCapacity.", "timestamp": "2026-02-17T09:02:00Z" }
      ],
      "logs": [
        { "source": "cluster-autoscaler", "lines": [ "2026-02-17T09:02:00Z ERROR VMSS scale-up FAILED: InsufficientCapacity in westus2", "2026-02-17T09:04:30Z ERROR Alternate size Standard_D8s_v5 also failed" ] }
      ],
      "runbook_excerpt": "Step 1: Check cluster-autoscaler logs. Step 2: Try alternate VM SKU or AZ."
    }, null, 2)
  },
  {
    label: 'DNS Cascade',
    icon: '🌍',
    text: JSON.stringify({
      "incident_id": "INC-2026-0403",
      "title": "DNS resolution failures causing cascading microservice timeouts",
      "severity": "SEV1",
      "timeframe": { "start": "2026-02-17T14:20:00Z" },
      "alerts": [
        { "name": "CoreDNS-ErrorRate-Critical", "description": "CoreDNS SERVFAIL rate exceeded 40% across all pods.", "timestamp": "2026-02-17T14:20:30Z" }
      ],
      "logs": [
        { "source": "coredns", "lines": [ "2026-02-17T14:19:45Z ERROR plugin/forward: no healthy upstreams for 168.63.129.16:53" ] }
      ],
      "metrics": [
        { "name": "coredns_servfail_rate_pct", "window": "5m", "values_summary": "Jumped from 0.01% to 42% at 14:20Z" }
      ],
      "runbook_excerpt": "Step 1: Check CoreDNS pod health. Step 2: Verify upstream DNS reachability."
    }, null, 2)
  },
  {
    label: 'Minimal CPU',
    icon: '📉',
    text: JSON.stringify({
      "incident_id": "INC-2026-0404",
      "title": "Minimal: CPU alert on staging batch processor",
      "severity": "SEV4",
      "timeframe": { "start": "2026-02-17T11:00:00Z" },
      "alerts": [
        { "name": "HighCPU-batch-processor-staging", "description": "CPU utilization exceeded 85% on batch-processor-staging.", "timestamp": "2026-02-17T11:00:00Z" }
      ],
      "metrics": [ { "name": "cpu_utilization_pct", "window": "10m", "values_summary": "Sustained at 87-91%" } ],
      "runbook_excerpt": "Check CPU. If sustained above 90%, restart the pod."
    }, null, 2)
  },
  {
    label: 'Storage Throttle',
    icon: '💽',
    text: JSON.stringify({
      "incident_id": "INC-2026-0405",
      "title": "Resolved: Storage account throttling caused image upload failures",
      "severity": "SEV2",
      "timeframe": { "start": "2026-02-16T18:00:00Z", "end": "2026-02-16T20:45:00Z" },
      "alerts": [
        { "name": "StorageThrottling-imagesblob", "description": "Azure Blob Storage account 'prodimagesblob' returning HTTP 429.", "timestamp": "2026-02-16T18:02:00Z" },
        { "name": "IncidentResolved-Storage", "description": "Storage throttling resolved. Image upload success rate at 99.7%.", "timestamp": "2026-02-16T20:45:00Z" }
      ],
      "logs": [
        { "source": "image-upload-service", "lines": [ "2026-02-16T18:01:00Z INFO  Processing bulk upload batch: 12,000 product images", "2026-02-16T19:00:00Z INFO  Oncall manually increased storage account IOPS tier to Premium" ] }
      ],
      "runbook_excerpt": "Step 1: Identify throttled storage account. Step 2: Check for bulk operations. Step 3: Upgrade tier if needed."
    }, null, 2)
  }
];
