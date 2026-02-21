# n8n Agent Dashboard - Operations Runbook

This runbook provides operational procedures for maintaining the n8n Agent Dashboard in production.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Weekly Operations](#weekly-operations)
3. [Monthly Operations](#monthly-operations)
4. [Incident Response](#incident-response)
5. [Backup & Recovery](#backup--recovery)
6. [Scaling](#scaling)
7. [Security](#security)

---

## Daily Operations

### Health Checks

```bash
# Check all services are running
cd /path/to/docker
docker-compose ps

# Check n8n health
curl https://n8n.yourdomain.com/healthz

# Check MCP bridge health
curl https://mcp.yourdomain.com/health

# Check dashboard health
curl https://your-app.vercel.app/api/health
```

### Monitor Key Metrics

1. **Dashboard**: https://your-app.vercel.app
   - Check execution success rate > 95%
   - Monitor AI cost trends
   - Review failed executions

2. **n8n Executions**: https://n8n.yourdomain.com/executions
   - Review failed executions
   - Check execution duration trends

3. **Logs**:
   ```bash
   docker-compose logs --tail=100 n8n
   docker-compose logs --tail=100 mcp-bridge
   ```

### Common Issues

#### High Error Rate

```bash
# Check recent errors
docker-compose logs n8n | grep -i error | tail -20

# Restart n8n if needed
docker-compose restart n8n
```

#### Slow Executions

1. Check n8n resource usage:
   ```bash
   docker stats n8n
   ```

2. If memory > 80%, increase limit in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 6G  # Increase from 4G
   ```

---

## Weekly Operations

### Workflow Review

1. Review all deployed workflows
2. Check for deprecation warnings
3. Update outdated node types
4. Test critical workflows manually

### Cost Analysis

```bash
# Check AI API usage
# Review dashboard stats
# Compare with budget
```

### Security Review

1. Check for unauthorized access attempts:
   ```bash
   docker-compose logs n8n | grep -i "unauthorized\|failed auth"
   ```

2. Review API key usage
3. Rotate keys if suspicious activity

### Backup Verification

```bash
# Check backup files exist
ls -la docker/backups/

# Verify backup integrity
# (Test restore on staging environment)
```

---

## Monthly Operations

### Full System Update

1. **Update n8n**:
   ```bash
   # Check latest version
   docker pull docker.n8n.io/n8nio/n8n:latest
   
   # Update docker-compose.yml with new version
   # Test on staging first
   
   # Deploy to production
   docker-compose pull n8n
   docker-compose up -d n8n
   ```

2. **Update dependencies**:
   ```bash
   npm update
   npm audit fix
   ```

3. **Update Docker images**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Performance Review

1. Analyze execution trends
2. Identify slow workflows
3. Optimize AI model selection
4. Review queue depth (if using Redis)

### Documentation Update

1. Update runbook with new procedures
2. Document any custom workflows
3. Update API documentation

---

## Incident Response

### Severity Levels

- **P1 (Critical)**: Complete system down, no workflows executing
- **P2 (High)**: Major functionality impaired, workarounds available
- **P3 (Medium)**: Minor issues, partial functionality affected
- **P4 (Low)**: Cosmetic issues, no functional impact

### Incident Response Procedures

#### P1: System Down

1. **Immediate Actions**:
   ```bash
   # Check service status
   docker-compose ps
   
   # Check logs for errors
   docker-compose logs --tail=200
   
   # Restart all services
   docker-compose restart
   ```

2. **Escalation**:
   - Notify team via Slack
   - Post status page update
   - Begin incident log

3. **Recovery**:
   - If restart fails, check disk space
   - Check database connectivity
   - Restore from backup if needed

#### P2: n8n Unresponsive

```bash
# Check n8n container
docker-compose ps n8n
docker-compose logs --tail=100 n8n

# Check resource usage
docker stats n8n

# Restart n8n
docker-compose restart n8n

# If still failing, check database
docker-compose logs postgres
```

#### P3: MCP Bridge Issues

```bash
# Switch to browser automation mode in dashboard
# Restart MCP bridge
docker-compose restart mcp-bridge

# Check connectivity
curl https://mcp.yourdomain.com/health
```

#### P4: AI Model Degradation

1. Switch to alternative model in dashboard
2. Check AI provider status page
3. Monitor for recovery

### Post-Incident Review

1. Document timeline
2. Identify root cause
3. Implement preventive measures
4. Update runbook

---

## Backup & Recovery

### Automated Backups

The backup service runs daily at midnight:

```bash
# Check backup files
ls -la docker/backups/

# Expected files:
# workflows-YYYYMMDD-HHMMSS.json
# credentials-YYYYMMDD-HHMMSS.json
```

### Manual Backup

```bash
cd docker

# Backup workflows
docker-compose exec n8n n8n export:workflow --all --output=/backup/workflows-manual.json

# Backup credentials
docker-compose exec n8n n8n export:credential --all --output=/backup/credentials-manual.json

# Backup database
docker-compose exec postgres pg_dump -U n8n n8n > backup/n8n-db-$(date +%Y%m%d).sql
```

### Restore from Backup

#### Restore Workflows

```bash
# Copy backup to container
docker cp backup/workflows-20240120-000000.json n8n:/tmp/backup.json

# Import workflows
docker-compose exec n8n n8n import:workflow --input=/tmp/backup.json
```

#### Restore Database

```bash
# Stop n8n
docker-compose stop n8n

# Restore database
docker-compose exec -T postgres psql -U n8n < backup/n8n-db-20240120.sql

# Start n8n
docker-compose start n8n
```

#### Full System Restore

1. Stop all services:
   ```bash
   docker-compose down
   ```

2. Restore volumes from backup:
   ```bash
   # If using volume backups
   docker volume rm n8n_n8n_data n8n_postgres_data
   # Restore from backup volumes
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

4. Import workflows:
   ```bash
   docker-compose exec n8n n8n import:workflow --all --input=/backup/workflows-latest.json
   ```

---

## Scaling

### Horizontal Scaling (Queue Mode)

Enable Redis and multiple n8n workers:

```yaml
# docker-compose.yml
services:
  n8n:
    environment:
      - N8N_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
    deploy:
      replicas: 3  # Scale to 3 workers
```

Start with queue profile:
```bash
docker-compose --profile queue up -d
```

### Vertical Scaling

Increase resource limits:

```yaml
services:
  n8n:
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4.0'
```

### Database Scaling

For high-volume deployments:

1. Use external PostgreSQL (AWS RDS, etc.)
2. Enable connection pooling (PgBouncer)
3. Set up read replicas

---

## Security

### Credential Rotation

#### n8n API Key

1. Generate new key in n8n UI
2. Update docker/.env
3. Restart MCP bridge:
   ```bash
   docker-compose restart mcp-bridge
   ```

#### Cloudflare Tunnel Token

1. Generate new token in Cloudflare Dashboard
2. Update docker/.env
3. Restart tunnel:
   ```bash
   docker-compose restart cloudflared
   ```

#### AI API Keys

1. Generate new keys from provider consoles
2. Update n8n credentials
3. Update docker/.env if used directly

### Access Control

#### Review Access Logs

```bash
# n8n access logs
docker-compose logs n8n | grep -i "login\|logout\|auth"

# MCP bridge logs
docker-compose logs mcp-bridge | grep -i "unauthorized"
```

#### IP Whitelisting

Configure in Cloudflare Dashboard:
1. Go to Zero Trust > Access
2. Create Access policy
3. Add IP whitelist

### Vulnerability Management

```bash
# Check for image updates
docker-compose pull --dry-run

# Check npm vulnerabilities
npm audit

# Update packages
npm update
npm audit fix
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|----------|
| Execution success rate | < 95% | < 90% |
| Average execution time | > 5s | > 10s |
| n8n memory usage | > 70% | > 90% |
| AI API error rate | > 5% | > 10% |
| Disk space | > 80% | > 90% |

### Setting Up Alerts

#### Slack Integration

1. Create Slack webhook
2. Add to n8n workflows
3. Configure alert thresholds

#### Email Alerts

Configure in docker/.env:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourdomain.com
ALERT_EMAIL=ops@yourdomain.com
```

---

## Contact Information

| Role | Name | Contact |
|------|------|---------|
| Primary On-Call | | |
| Secondary On-Call | | |
| Engineering Lead | | |
| Product Owner | | |

---

## Appendix

### Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f n8n

# Execute command in container
docker-compose exec n8n sh

# Check container stats
docker stats

# Clean up unused resources
docker system prune -a

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start with specific profile
docker-compose --profile browser up -d
```

### Configuration Files

| File | Purpose |
|------|---------|
| `docker/.env` | Docker service configuration |
| `.env.local` | Dashboard configuration |
| `docker/docker-compose.yml` | Service orchestration |
| `docker/cloudflared/config.yml` | Tunnel configuration |

### External Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Moonshot API Docs](https://platform.moonshot.cn/docs/)
- [Gemini API Docs](https://ai.google.dev/docs)

---

*Last updated: 2024-01-20*
*Version: 1.0.0*
