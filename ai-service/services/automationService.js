/**
 * Automation Service - Tự động hóa quá trình tưới cây
 */

const sensorService = require('./sensorService');
const aiPredictionService = require('./aiPredictionService');
const irrigationOptimizationService = require('./irrigationOptimizationService');
const earlyWarningService = require('./earlyWarningService');

class AutomationService {
  constructor() {
    this.automationRules = [];
    this.activeAutomations = new Map();
    this.automationHistory = [];
    this.deviceConnections = new Map();
    this.safetyLimits = {
      maxWaterPerHour: 500, // ml
      maxWaterPerDay: 2000, // ml
      minTimeBetweenIrrigations: 2 * 60 * 60 * 1000, // 2 hours in ms
      maxConsecutiveIrrigations: 3
    };
  }

  /**
   * Thiết lập automation cho một cây cụ thể
   */
  async setupAutomation(plantId, automationConfig) {
    try {
      const {
        enabled = true,
        mode = 'smart', // 'smart', 'scheduled', 'sensor_based'
        triggers = [],
        actions = [],
        constraints = {},
        notifications = {},
        safetyOverrides = {}
      } = automationConfig;

      // Validate configuration
      const validation = this.validateAutomationConfig(automationConfig);
      if (!validation.valid) {
        throw new Error(`Cấu hình không hợp lệ: ${validation.errors.join(', ')}`);
      }

      // Merge safety limits
      const mergedSafetyLimits = { ...this.safetyLimits, ...safetyOverrides };

      // Create automation rule
      const automationRule = {
        id: `automation_${plantId}_${Date.now()}`,
        plantId,
        enabled,
        mode,
        triggers: this.processTriggers(triggers),
        actions: this.processActions(actions),
        constraints: this.processConstraints(constraints),
        notifications,
        safetyLimits: mergedSafetyLimits,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        statistics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          waterDelivered: 0,
          lastExecution: null
        }
      };

      // Save automation rule
      this.automationRules.push(automationRule);

      // Start automation if enabled
      if (enabled) {
        await this.startAutomation(automationRule);
      }

      return {
        success: true,
        automationId: automationRule.id,
        message: 'Automation đã được thiết lập thành công',
        config: automationRule
      };
    } catch (error) {
      console.error('Lỗi thiết lập automation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bắt đầu automation
   */
  async startAutomation(automationRule) {
    try {
      const { id, plantId, mode } = automationRule;

      // Stop existing automation if running
      if (this.activeAutomations.has(id)) {
        await this.stopAutomation(id);
      }

      // Create automation context
      const automationContext = {
        rule: automationRule,
        status: 'running',
        startTime: new Date(),
        lastCheck: null,
        nextCheck: null,
        executionCount: 0,
        waterDeliveredToday: 0,
        lastWateringTime: null,
        consecutiveIrrigations: 0
      };

      // Start automation based on mode
      switch (mode) {
        case 'smart':
          await this.startSmartAutomation(automationContext);
          break;
        case 'scheduled':
          await this.startScheduledAutomation(automationContext);
          break;
        case 'sensor_based':
          await this.startSensorBasedAutomation(automationContext);
          break;
        default:
          throw new Error(`Chế độ automation không được hỗ trợ: ${mode}`);
      }

      // Store active automation
      this.activeAutomations.set(id, automationContext);

      console.log(`Started automation ${id} for plant ${plantId} in ${mode} mode`);
      return true;
    } catch (error) {
      console.error('Lỗi bắt đầu automation:', error);
      return false;
    }
  }

  /**
   * Smart Automation - Sử dụng AI để quyết định
   */
  async startSmartAutomation(context) {
    const { rule } = context;
    const checkInterval = 30 * 60 * 1000; // 30 minutes

    const smartCheck = async () => {
      try {
        if (!this.activeAutomations.has(rule.id)) return; // Automation stopped

        context.lastCheck = new Date();
        context.executionCount++;

        // Get AI prediction
        const prediction = await aiPredictionService.predictIrrigationNeed(rule.plantId);
        
        // Get early warning analysis
        const warningAnalysis = await earlyWarningService.analyzeAndAlert(rule.plantId);

        // Check if irrigation is needed
        const shouldIrrigate = this.shouldExecuteIrrigation(prediction, warningAnalysis, context);

        if (shouldIrrigate.execute) {
          const irrigationResult = await this.executeIrrigation(rule.plantId, shouldIrrigate.amount, context);
          
          if (irrigationResult.success) {
            await this.logAutomationExecution(rule.id, 'irrigation', irrigationResult);
            await this.sendNotification(rule, 'irrigation_executed', irrigationResult);
          } else {
            await this.handleAutomationError(rule.id, irrigationResult.error);
          }
        }

        // Schedule next check
        context.nextCheck = new Date(Date.now() + checkInterval);
        setTimeout(smartCheck, checkInterval);

      } catch (error) {
        console.error('Lỗi trong smart automation check:', error);
        await this.handleAutomationError(rule.id, error);
        
        // Retry after longer interval
        setTimeout(smartCheck, checkInterval * 2);
      }
    };

    // Start first check
    setTimeout(smartCheck, 1000);
  }

  /**
   * Scheduled Automation - Theo lịch cố định
   */
  async startScheduledAutomation(context) {
    const { rule } = context;
    
    // Parse schedule from triggers
    const schedules = rule.triggers.filter(t => t.type === 'schedule');
    
    schedules.forEach(schedule => {
      this.scheduleIrrigation(rule, schedule, context);
    });
  }

  /**
   * Sensor-based Automation - Dựa trên ngưỡng cảm biến
   */
  async startSensorBasedAutomation(context) {
    const { rule } = context;
    const checkInterval = 15 * 60 * 1000; // 15 minutes

    const sensorCheck = async () => {
      try {
        if (!this.activeAutomations.has(rule.id)) return;

        context.lastCheck = new Date();
        context.executionCount++;

        // Get current sensor data
        const sensorData = await sensorService.getLatestSensorData(rule.plantId);
        
        // Check sensor-based triggers
        const triggeredActions = this.evaluateSensorTriggers(rule.triggers, sensorData);

        for (const action of triggeredActions) {
          const result = await this.executeAction(action, rule.plantId, context);
          await this.logAutomationExecution(rule.id, action.type, result);
          
          if (result.success && action.type === 'irrigation') {
            await this.sendNotification(rule, 'sensor_triggered_irrigation', result);
          }
        }

        // Schedule next check
        context.nextCheck = new Date(Date.now() + checkInterval);
        setTimeout(sensorCheck, checkInterval);

      } catch (error) {
        console.error('Lỗi trong sensor-based automation check:', error);
        await this.handleAutomationError(rule.id, error);
        setTimeout(sensorCheck, checkInterval * 2);
      }
    };

    // Start first check
    setTimeout(sensorCheck, 1000);
  }

  /**
   * Thực hiện tưới nước
   */
  async executeIrrigation(plantId, amount, context) {
    try {
      const { rule } = context;

      // Safety checks
      const safetyCheck = this.performSafetyChecks(amount, context);
      if (!safetyCheck.safe) {
        return {
          success: false,
          error: `Safety check failed: ${safetyCheck.reason}`,
          blocked: true
        };
      }

      // Check device connection
      const deviceStatus = await this.checkDeviceConnection(plantId);
      if (!deviceStatus.connected) {
        return {
          success: false,
          error: 'Thiết bị tưới không kết nối',
          deviceError: true
        };
      }

      // Execute irrigation
      const irrigationResult = await this.sendIrrigationCommand(plantId, amount);
      
      if (irrigationResult.success) {
        // Update context
        context.waterDeliveredToday += amount;
        context.lastWateringTime = new Date();
        context.consecutiveIrrigations++;
        
        // Update rule statistics
        rule.statistics.totalExecutions++;
        rule.statistics.successfulExecutions++;
        rule.statistics.waterDelivered += amount;
        rule.statistics.lastExecution = new Date().toISOString();

        // Reset consecutive count after delay
        setTimeout(() => {
          context.consecutiveIrrigations = 0;
        }, rule.safetyLimits.minTimeBetweenIrrigations);

        return {
          success: true,
          amount,
          timestamp: new Date().toISOString(),
          deviceResponse: irrigationResult.deviceResponse
        };
      } else {
        rule.statistics.failedExecutions++;
        return {
          success: false,
          error: irrigationResult.error
        };
      }
    } catch (error) {
      console.error('Lỗi thực hiện tưới nước:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Kiểm tra an toàn trước khi tưới
   */
  performSafetyChecks(amount, context) {
    const { rule } = context;
    const now = new Date();

    // Check daily water limit
    if (context.waterDeliveredToday + amount > rule.safetyLimits.maxWaterPerDay) {
      return {
        safe: false,
        reason: `Vượt quá giới hạn nước hàng ngày (${rule.safetyLimits.maxWaterPerDay}ml)`
      };
    }

    // Check hourly water limit
    if (amount > rule.safetyLimits.maxWaterPerHour) {
      return {
        safe: false,
        reason: `Vượt quá giới hạn nước mỗi giờ (${rule.safetyLimits.maxWaterPerHour}ml)`
      };
    }

    // Check minimum time between irrigations
    if (context.lastWateringTime) {
      const timeSinceLastWatering = now - context.lastWateringTime;
      if (timeSinceLastWatering < rule.safetyLimits.minTimeBetweenIrrigations) {
        return {
          safe: false,
          reason: `Chưa đủ thời gian từ lần tưới trước (tối thiểu ${rule.safetyLimits.minTimeBetweenIrrigations / 60000} phút)`
        };
      }
    }

    // Check consecutive irrigations
    if (context.consecutiveIrrigations >= rule.safetyLimits.maxConsecutiveIrrigations) {
      return {
        safe: false,
        reason: `Vượt quá số lần tưới liên tiếp cho phép (${rule.safetyLimits.maxConsecutiveIrrigations})`
      };
    }

    return { safe: true };
  }

  /**
   * Gửi lệnh tưới đến thiết bị
   */
  async sendIrrigationCommand(plantId, amount) {
    try {
      // Mô phỏng gửi lệnh đến thiết bị IoT
      console.log(`Sending irrigation command: Plant ${plantId}, Amount: ${amount}ml`);
      
      // Simulate device communication delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure
      const success = Math.random() > 0.05; // 95% success rate
      
      if (success) {
        return {
          success: true,
          deviceResponse: {
            status: 'completed',
            actualAmount: amount,
            duration: Math.ceil(amount / 10), // 10ml per second
            deviceId: `irrigation_device_${plantId}`,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: 'Device communication failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Kiểm tra kết nối thiết bị
   */
  async checkDeviceConnection(plantId) {
    try {
      // Mô phỏng kiểm tra kết nối thiết bị
      const deviceId = `irrigation_device_${plantId}`;
      
      // Simulate device status check
      const connected = Math.random() > 0.1; // 90% uptime
      
      return {
        connected,
        deviceId,
        lastSeen: connected ? new Date().toISOString() : new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        batteryLevel: connected ? Math.floor(Math.random() * 100) : null,
        signalStrength: connected ? Math.floor(Math.random() * 100) : null
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Đánh giá xem có nên thực hiện tưới không
   */
  shouldExecuteIrrigation(prediction, warningAnalysis, context) {
    const { rule } = context;
    
    // Check AI prediction
    if (!prediction.prediction.needsWatering) {
      return { execute: false, reason: 'AI prediction: không cần tưới' };
    }

    // Check urgency level
    const urgencyLevel = prediction.prediction.urgencyLevel;
    if (urgencyLevel === 'low' && context.consecutiveIrrigations > 0) {
      return { execute: false, reason: 'Urgency thấp và đã tưới gần đây' };
    }

    // Check early warning alerts
    const criticalAlerts = warningAnalysis.alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.some(a => a.category === 'root_rot')) {
      return { execute: false, reason: 'Cảnh báo nguy cơ thối rễ' };
    }

    // Determine amount
    let amount = prediction.prediction.recommendedAmount;
    
    // Adjust based on constraints
    if (rule.constraints.maxAmountPerIrrigation) {
      amount = Math.min(amount, rule.constraints.maxAmountPerIrrigation);
    }

    // Adjust based on urgency
    if (urgencyLevel === 'critical') {
      amount *= 1.2;
    } else if (urgencyLevel === 'low') {
      amount *= 0.8;
    }

    return {
      execute: true,
      amount: Math.round(amount),
      reason: `AI prediction: ${urgencyLevel} urgency`,
      confidence: prediction.prediction.confidence
    };
  }

  /**
   * Đánh giá triggers dựa trên cảm biến
   */
  evaluateSensorTriggers(triggers, sensorData) {
    const triggeredActions = [];
    
    triggers.forEach(trigger => {
      if (trigger.type === 'sensor_threshold') {
        const { parameter, operator, value, action } = trigger;
        const currentValue = sensorData[parameter];
        
        if (currentValue !== undefined) {
          let triggered = false;
          
          switch (operator) {
            case 'less_than':
              triggered = currentValue < value;
              break;
            case 'greater_than':
              triggered = currentValue > value;
              break;
            case 'equals':
              triggered = Math.abs(currentValue - value) < 0.1;
              break;
          }
          
          if (triggered) {
            triggeredActions.push({
              ...action,
              trigger: trigger,
              currentValue,
              thresholdValue: value
            });
          }
        }
      }
    });
    
    return triggeredActions;
  }

  /**
   * Thực hiện action
   */
  async executeAction(action, plantId, context) {
    switch (action.type) {
      case 'irrigation':
        return await this.executeIrrigation(plantId, action.amount, context);
      case 'notification':
        return await this.sendNotification(context.rule, action.message, { plantId });
      case 'alert':
        return await this.createAlert(plantId, action.severity, action.message);
      default:
        return {
          success: false,
          error: `Action type không được hỗ trợ: ${action.type}`
        };
    }
  }

  /**
   * Lên lịch tưới theo schedule
   */
  scheduleIrrigation(rule, schedule, context) {
    const { time, days, amount } = schedule;
    
    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    const scheduleExecution = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if today is in the scheduled days
      if (days.includes(currentDay)) {
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If scheduled time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilExecution = scheduledTime - now;
        
        setTimeout(async () => {
          if (this.activeAutomations.has(rule.id)) {
            const result = await this.executeIrrigation(rule.plantId, amount, context);
            await this.logAutomationExecution(rule.id, 'scheduled_irrigation', result);
            
            if (result.success) {
              await this.sendNotification(rule, 'scheduled_irrigation_executed', result);
            }
          }
          
          // Schedule next execution
          scheduleExecution();
        }, timeUntilExecution);
      } else {
        // Schedule check for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        setTimeout(scheduleExecution, tomorrow - now);
      }
    };
    
    scheduleExecution();
  }

  /**
   * Gửi thông báo
   */
  async sendNotification(rule, type, data) {
    try {
      const notification = {
        id: `notification_${Date.now()}`,
        plantId: rule.plantId,
        automationId: rule.id,
        type,
        message: this.generateNotificationMessage(type, data),
        data,
        timestamp: new Date().toISOString(),
        sent: false
      };

      // Check notification preferences
      if (this.shouldSendNotification(rule.notifications, type)) {
        // Simulate sending notification (email, SMS, push, etc.)
        console.log(`Sending notification: ${notification.message}`);
        notification.sent = true;
      }

      return {
        success: true,
        notification
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tạo cảnh báo
   */
  async createAlert(plantId, severity, message) {
    const alert = {
      id: `alert_${Date.now()}`,
      plantId,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    console.log(`Alert created: [${severity.toUpperCase()}] ${message}`);
    
    return {
      success: true,
      alert
    };
  }

  /**
   * Log automation execution
   */
  async logAutomationExecution(automationId, actionType, result) {
    const logEntry = {
      id: `log_${Date.now()}`,
      automationId,
      actionType,
      result,
      timestamp: new Date().toISOString()
    };

    this.automationHistory.push(logEntry);

    // Keep only recent history
    if (this.automationHistory.length > 1000) {
      this.automationHistory = this.automationHistory.slice(-1000);
    }
  }

  /**
   * Xử lý lỗi automation
   */
  async handleAutomationError(automationId, error) {
    console.error(`Automation ${automationId} error:`, error);
    
    const automation = this.activeAutomations.get(automationId);
    if (automation) {
      automation.errorCount = (automation.errorCount || 0) + 1;
      automation.lastError = {
        message: error.message || error,
        timestamp: new Date().toISOString()
      };

      // Disable automation if too many errors
      if (automation.errorCount >= 5) {
        await this.stopAutomation(automationId);
        console.log(`Automation ${automationId} disabled due to repeated errors`);
      }
    }
  }

  /**
   * Dừng automation
   */
  async stopAutomation(automationId) {
    try {
      const automation = this.activeAutomations.get(automationId);
      if (automation) {
        automation.status = 'stopped';
        automation.stopTime = new Date();
        this.activeAutomations.delete(automationId);
        
        console.log(`Stopped automation ${automationId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi dừng automation:', error);
      return false;
    }
  }

  /**
   * Lấy trạng thái automation
   */
  getAutomationStatus(automationId) {
    const automation = this.activeAutomations.get(automationId);
    if (!automation) {
      return { status: 'not_found' };
    }

    return {
      status: automation.status,
      startTime: automation.startTime,
      lastCheck: automation.lastCheck,
      nextCheck: automation.nextCheck,
      executionCount: automation.executionCount,
      waterDeliveredToday: automation.waterDeliveredToday,
      lastWateringTime: automation.lastWateringTime,
      consecutiveIrrigations: automation.consecutiveIrrigations,
      errorCount: automation.errorCount || 0,
      lastError: automation.lastError
    };
  }

  /**
   * Lấy danh sách tất cả automation
   */
  getAllAutomations() {
    return this.automationRules.map(rule => ({
      ...rule,
      status: this.activeAutomations.has(rule.id) ? 'running' : 'stopped',
      runtime: this.getAutomationStatus(rule.id)
    }));
  }

  // Utility methods
  validateAutomationConfig(config) {
    const errors = [];
    
    if (!config.mode || !['smart', 'scheduled', 'sensor_based'].includes(config.mode)) {
      errors.push('Mode không hợp lệ');
    }
    
    if (!config.triggers || config.triggers.length === 0) {
      errors.push('Cần ít nhất một trigger');
    }
    
    if (!config.actions || config.actions.length === 0) {
      errors.push('Cần ít nhất một action');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  processTriggers(triggers) {
    return triggers.map(trigger => ({
      ...trigger,
      id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      processed: true
    }));
  }

  processActions(actions) {
    return actions.map(action => ({
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      processed: true
    }));
  }

  processConstraints(constraints) {
    return {
      maxAmountPerIrrigation: constraints.maxAmountPerIrrigation || 500,
      allowedTimeRanges: constraints.allowedTimeRanges || [{ start: '06:00', end: '20:00' }],
      weatherConditions: constraints.weatherConditions || { maxRainProbability: 70 },
      ...constraints
    };
  }

  generateNotificationMessage(type, data) {
    const messages = {
      irrigation_executed: `Đã tưới ${data.amount}ml nước cho cây`,
      sensor_triggered_irrigation: `Tưới tự động kích hoạt bởi cảm biến: ${data.amount}ml`,
      scheduled_irrigation_executed: `Tưới theo lịch: ${data.amount}ml`,
      automation_error: `Lỗi automation: ${data.error}`,
      device_offline: 'Thiết bị tưới mất kết nối',
      safety_limit_reached: `Đã đạt giới hạn an toàn: ${data.reason}`
    };
    
    return messages[type] || `Automation notification: ${type}`;
  }

  shouldSendNotification(preferences, type) {
    if (!preferences || !preferences.enabled) return false;
    
    const typePreferences = preferences.types || {};
    return typePreferences[type] !== false; // Send by default unless explicitly disabled
  }

  /**
   * Cập nhật cấu hình automation
   */
  async updateAutomationConfig(automationId, updates) {
    try {
      const ruleIndex = this.automationRules.findIndex(r => r.id === automationId);
      if (ruleIndex === -1) {
        throw new Error('Automation không tồn tại');
      }

      const rule = this.automationRules[ruleIndex];
      const updatedRule = { ...rule, ...updates, lastModified: new Date().toISOString() };
      
      // Validate updated config
      const validation = this.validateAutomationConfig(updatedRule);
      if (!validation.valid) {
        throw new Error(`Cấu hình không hợp lệ: ${validation.errors.join(', ')}`);
      }

      this.automationRules[ruleIndex] = updatedRule;

      // Restart automation if it's running
      if (this.activeAutomations.has(automationId)) {
        await this.stopAutomation(automationId);
        if (updatedRule.enabled) {
          await this.startAutomation(updatedRule);
        }
      }

      return {
        success: true,
        message: 'Automation đã được cập nhật',
        config: updatedRule
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xóa automation
   */
  async deleteAutomation(automationId) {
    try {
      // Stop automation if running
      await this.stopAutomation(automationId);

      // Remove from rules
      const ruleIndex = this.automationRules.findIndex(r => r.id === automationId);
      if (ruleIndex !== -1) {
        this.automationRules.splice(ruleIndex, 1);
      }

      return {
        success: true,
        message: 'Automation đã được xóa'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy lịch sử automation
   */
  getAutomationHistory(automationId, limit = 50) {
    return this.automationHistory
      .filter(entry => !automationId || entry.automationId === automationId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Thống kê automation
   */
  getAutomationStatistics(automationId) {
    const rule = this.automationRules.find(r => r.id === automationId);
    if (!rule) {
      return { error: 'Automation không tồn tại' };
    }

    const history = this.getAutomationHistory(automationId, 100);
    const irrigationHistory = history.filter(h => h.actionType.includes('irrigation'));

    return {
      ...rule.statistics,
      recentExecutions: history.length,
      recentIrrigations: irrigationHistory.length,
      averageWaterPerIrrigation: irrigationHistory.length > 0 
        ? irrigationHistory.reduce((sum, h) => sum + (h.result.amount || 0), 0) / irrigationHistory.length 
        : 0,
      successRate: rule.statistics.totalExecutions > 0 
        ? (rule.statistics.successfulExecutions / rule.statistics.totalExecutions) * 100 
        : 0
    };
  }
}

module.exports = new AutomationService();