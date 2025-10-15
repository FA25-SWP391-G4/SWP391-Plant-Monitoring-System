#!/usr/bin/env node

/**
 * Monitoring Setup Script for AI Features Integration
 * Sets up comprehensive monitoring, alerting, and analytics
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class MonitoringSetup {
  constructor() {
    this.monitoringDir = path.join(__dirname);
    this.prometheusDir = path.join(this.monitoringDir, 'prometheus');
    this.grafanaDir = path.join(this.monitoringDir, 'grafana');
    this.alertmanagerDir = path.join(this.monitoringDir, 'alertmanager');
  }

  async setup() {
    console.log('🔧 Setting up monitoring infrastructure...');
    
    try {
      await this.createDirectories();
      await this.setupPrometheus();
      await this.setupGrafana();
      await this.setupAlertmanager();
      await this.createDashboards();
      await this.setupAlertRules();
      
      console.log('✅ Monitoring setup completed successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Monitoring setup failed:', error.message);
      process.exit(1);
    }
  }

  async createDirectories() {
    console.log('📁 Creating monitoring directories...');
    
    const directories = [
      this.prometheusDir,
      path.join(this.grafanaDir, 'dashboards'),
      path.join(this.grafanaDir, 'datasources'),
      path.join(this.grafanaDir, 'provisioning', 'dashboards'),
      path.join(this.grafanaDir, 'provisioning', 'datasources'),
      this.alertmanagerDir
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async setupPrometheus() {
    console.log('📊 Setting up Prometheus configuration...');
    
    const prometheusConfig = {
      global: {
        scrape_interval: '15s',
        evaluation_interval: '15s'
      },
      rule_files: [
        'alert_rules.yml'
      ],
      scrape_configs: [
        {
          job_name: 'main-server',
          static_configs: [
            { targets: ['main-server:3010'] }
          ],
          metrics_path: '/metrics',
          scrape_interval: '30s'
        },
        {
          job_name: 'ai-service',
          static_configs: [
            { targets: ['ai-service:3001'] }
          ],
          metrics_path: '/api/ai/metrics',
          scrape_interval: '30s'
        },
        {
          job_name: 'postgresql',
          static_configs: [
            { targets: ['postgresql:5432'] }
          ],
          scrape_interval: '60s'
        },
        {
          job_name: 'redis',
          static_configs: [
            { targets: ['redis:6379'] }
          ],
          scrape_interval: '60s'
        },
        {
          job_name: 'mosquitto',
          static_configs: [
            { targets: ['mosquitto:1883'] }
          ],
          scrape_interval: '60s'
        },
        {
          job_name: 'node-exporter',
          static_configs: [
            { targets: ['node-exporter:9100'] }
          ],
          scrape_interval: '30s'
        }
      ],
      alerting: {
        alertmanagers: [
          {
            static_configs: [
              { targets: ['alertmanager:9093'] }
            ]
          }
        ]
      }
    };

    const yamlContent = this.objectToYaml(prometheusConfig);
    await fs.writeFile(
      path.join(this.prometheusDir, 'prometheus.yml'),
      yamlContent
    );
  }

  async setupGrafana() {
    console.log('📈 Setting up Grafana configuration...');
    
    // Datasource configuration
    const datasourceConfig = {
      apiVersion: 1,
      datasources: [
        {
          name: 'Prometheus',
          type: 'prometheus',
          access: 'proxy',
          url: 'http://prometheus:9090',
          isDefault: true,
          editable: true
        }
      ]
    };

    await fs.writeFile(
      path.join(this.grafanaDir, 'provisioning', 'datasources', 'prometheus.yml'),
      this.objectToYaml(datasourceConfig)
    );

    // Dashboard provisioning
    const dashboardProvisioning = {
      apiVersion: 1,
      providers: [
        {
          name: 'AI Service Dashboards',
          orgId: 1,
          folder: '',
          type: 'file',
          disableDeletion: false,
          updateIntervalSeconds: 10,
          allowUiUpdates: true,
          options: {
            path: '/etc/grafana/provisioning/dashboards'
          }
        }
      ]
    };

    await fs.writeFile(
      path.join(this.grafanaDir, 'provisioning', 'dashboards', 'dashboard.yml'),
      this.objectToYaml(dashboardProvisioning)
    );
  }

  async setupAlertmanager() {
    console.log('🚨 Setting up Alertmanager configuration...');
    
    const alertmanagerConfig = {
      global: {
        smtp_smarthost: 'localhost:587',
        smtp_from: 'alerts@plant-monitoring.local'
      },
      route: {
        group_by: ['alertname'],
        group_wait: '10s',
        group_interval: '10s',
        repeat_interval: '1h',
        receiver: 'web.hook'
      },
      receivers: [
        {
          name: 'web.hook',
          webhook_configs: [
            {
              url: 'http://main-server:3010/api/alerts/webhook',
              send_resolved: true
            }
          ]
        }
      ]
    };

    await fs.writeFile(
      path.join(this.alertmanagerDir, 'alertmanager.yml'),
      this.objectToYaml(alertmanagerConfig)
    );
  }

  async createDashboards() {
    console.log('📊 Creating Grafana dashboards...');
    
    // AI Service Overview Dashboard
    const aiServiceDashboard = {
      dashboard: {
        id: null,
        title: 'AI Service Overview',
        tags: ['ai', 'monitoring', 'plant-monitoring'],
        timezone: 'browser',
        panels: [
          {
            id: 1,
            title: 'AI Service Health',
            type: 'stat',
            targets: [
              {
                expr: 'up{job="ai-service"}',
                legendFormat: 'AI Service Status'
              }
            ],
            fieldConfig: {
              defaults: {
                color: {
                  mode: 'thresholds'
                },
                thresholds: {
                  steps: [
                    { color: 'red', value: 0 },
                    { color: 'green', value: 1 }
                  ]
                }
              }
            },
            gridPos: { h: 8, w: 12, x: 0, y: 0 }
          },
          {
            id: 2,
            title: 'API Response Time',
            type: 'graph',
            targets: [
              {
                expr: 'avg_response_time{job="ai-service"}',
                legendFormat: 'Average Response Time'
              }
            ],
            yAxes: [
              {
                label: 'Time (ms)',
                min: 0
              }
            ],
            gridPos: { h: 8, w: 12, x: 12, y: 0 }
          },
          {
            id: 3,
            title: 'AI Feature Usage',
            type: 'graph',
            targets: [
              {
                expr: 'rate(chatbot_requests_total[5m])',
                legendFormat: 'Chatbot Requests/sec'
              },
              {
                expr: 'rate(disease_analyses_total[5m])',
                legendFormat: 'Disease Analyses/sec'
              },
              {
                expr: 'rate(irrigation_predictions_total[5m])',
                legendFormat: 'Irrigation Predictions/sec'
              }
            ],
            gridPos: { h: 8, w: 24, x: 0, y: 8 }
          },
          {
            id: 4,
            title: 'Error Rate',
            type: 'graph',
            targets: [
              {
                expr: 'rate(http_requests_total{status=~"5.."}[5m])',
                legendFormat: 'Error Rate'
              }
            ],
            yAxes: [
              {
                label: 'Errors/sec',
                min: 0
              }
            ],
            gridPos: { h: 8, w: 12, x: 0, y: 16 }
          },
          {
            id: 5,
            title: 'Memory Usage',
            type: 'graph',
            targets: [
              {
                expr: 'process_resident_memory_bytes{job="ai-service"}',
                legendFormat: 'Memory Usage'
              }
            ],
            yAxes: [
              {
                label: 'Bytes',
                min: 0
              }
            ],
            gridPos: { h: 8, w: 12, x: 12, y: 16 }
          }
        ],
        time: {
          from: 'now-1h',
          to: 'now'
        },
        refresh: '30s'
      }
    };

    await fs.writeFile(
      path.join(this.grafanaDir, 'provisioning', 'dashboards', 'ai-service-overview.json'),
      JSON.stringify(aiServiceDashboard, null, 2)
    );

    // System Health Dashboard
    const systemHealthDashboard = {
      dashboard: {
        id: null,
        title: 'System Health',
        tags: ['system', 'health', 'infrastructure'],
        timezone: 'browser',
        panels: [
          {
            id: 1,
            title: 'Service Status',
            type: 'stat',
            targets: [
              {
                expr: 'up{job="main-server"}',
                legendFormat: 'Main Server'
              },
              {
                expr: 'up{job="ai-service"}',
                legendFormat: 'AI Service'
              },
              {
                expr: 'up{job="postgresql"}',
                legendFormat: 'PostgreSQL'
              },
              {
                expr: 'up{job="redis"}',
                legendFormat: 'Redis'
              },
              {
                expr: 'up{job="mosquitto"}',
                legendFormat: 'MQTT Broker'
              }
            ],
            gridPos: { h: 8, w: 24, x: 0, y: 0 }
          },
          {
            id: 2,
            title: 'CPU Usage',
            type: 'graph',
            targets: [
              {
                expr: '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
                legendFormat: 'CPU Usage %'
              }
            ],
            gridPos: { h: 8, w: 12, x: 0, y: 8 }
          },
          {
            id: 3,
            title: 'Memory Usage',
            type: 'graph',
            targets: [
              {
                expr: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
                legendFormat: 'Memory Usage %'
              }
            ],
            gridPos: { h: 8, w: 12, x: 12, y: 8 }
          }
        ],
        time: {
          from: 'now-1h',
          to: 'now'
        },
        refresh: '30s'
      }
    };

    await fs.writeFile(
      path.join(this.grafanaDir, 'provisioning', 'dashboards', 'system-health.json'),
      JSON.stringify(systemHealthDashboard, null, 2)
    );
  }

  async setupAlertRules() {
    console.log('🚨 Setting up alert rules...');
    
    const alertRules = {
      groups: [
        {
          name: 'ai-service-alerts',
          rules: [
            {
              alert: 'AIServiceDown',
              expr: 'up{job="ai-service"} == 0',
              for: '1m',
              labels: {
                severity: 'critical'
              },
              annotations: {
                summary: 'AI Service is down',
                description: 'AI Service has been down for more than 1 minute.'
              }
            },
            {
              alert: 'HighResponseTime',
              expr: 'avg_response_time{job="ai-service"} > 5000',
              for: '5m',
              labels: {
                severity: 'warning'
              },
              annotations: {
                summary: 'High response time detected',
                description: 'AI Service response time is above 5 seconds for more than 5 minutes.'
              }
            },
            {
              alert: 'HighErrorRate',
              expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.1',
              for: '5m',
              labels: {
                severity: 'warning'
              },
              annotations: {
                summary: 'High error rate detected',
                description: 'Error rate is above 10% for more than 5 minutes.'
              }
            },
            {
              alert: 'HighMemoryUsage',
              expr: 'process_resident_memory_bytes{job="ai-service"} > 1073741824',
              for: '10m',
              labels: {
                severity: 'warning'
              },
              annotations: {
                summary: 'High memory usage',
                description: 'AI Service memory usage is above 1GB for more than 10 minutes.'
              }
            }
          ]
        },
        {
          name: 'system-alerts',
          rules: [
            {
              alert: 'DatabaseDown',
              expr: 'up{job="postgresql"} == 0',
              for: '1m',
              labels: {
                severity: 'critical'
              },
              annotations: {
                summary: 'Database is down',
                description: 'PostgreSQL database has been down for more than 1 minute.'
              }
            },
            {
              alert: 'RedisDown',
              expr: 'up{job="redis"} == 0',
              for: '1m',
              labels: {
                severity: 'warning'
              },
              annotations: {
                summary: 'Redis is down',
                description: 'Redis cache has been down for more than 1 minute.'
              }
            },
            {
              alert: 'MQTTBrokerDown',
              expr: 'up{job="mosquitto"} == 0',
              for: '1m',
              labels: {
                severity: 'warning'
              },
              annotations: {
                summary: 'MQTT Broker is down',
                description: 'MQTT Broker has been down for more than 1 minute.'
              }
            }
          ]
        }
      ]
    };

    await fs.writeFile(
      path.join(this.prometheusDir, 'alert_rules.yml'),
      this.objectToYaml(alertRules)
    );
  }

  objectToYaml(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.objectToYaml(item, indent + 2);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else if (typeof value === 'string') {
        yaml += `${spaces}${key}: "${value}"\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  printSummary() {
    console.log('\n📊 Monitoring Setup Summary:');
    console.log('================================');
    console.log('✅ Prometheus configuration created');
    console.log('✅ Grafana dashboards created');
    console.log('✅ Alertmanager configuration created');
    console.log('✅ Alert rules configured');
    console.log('\n🔗 Access URLs (after deployment):');
    console.log('  Prometheus: http://localhost:9090');
    console.log('  Grafana:    http://localhost:3030 (admin/admin123)');
    console.log('  Alertmanager: http://localhost:9093');
    console.log('\n📈 Available Dashboards:');
    console.log('  - AI Service Overview');
    console.log('  - System Health');
    console.log('\n🚨 Configured Alerts:');
    console.log('  - AI Service Down');
    console.log('  - High Response Time');
    console.log('  - High Error Rate');
    console.log('  - High Memory Usage');
    console.log('  - Database Down');
    console.log('  - Redis Down');
    console.log('  - MQTT Broker Down');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.setup().catch(console.error);
}

module.exports = MonitoringSetup;