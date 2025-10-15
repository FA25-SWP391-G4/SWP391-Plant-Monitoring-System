/**
 * Irrigation Optimization Service - Tối ưu lịch tưới tự động
 */

const sensorService = require('./sensorService');
const aiPredictionService = require('./aiPredictionService');

class IrrigationOptimizationService {
  constructor() {
    this.optimizationHistory = [];
    this.learningData = [];
    this.optimizationAlgorithms = {
      genetic: this.geneticAlgorithm.bind(this),
      reinforcement: this.reinforcementLearning.bind(this),
      rule_based: this.ruleBasedOptimization.bind(this)
    };
  }

  /**
   * Tối ưu lịch tưới cho một cây cụ thể
   */
  async optimizeIrrigationSchedule(plantId, options = {}) {
    try {
      const {
        timeHorizon = 7, // days
        algorithm = 'reinforcement',
        constraints = {},
        preferences = {}
      } = options;

      // Lấy dữ liệu cần thiết
      const plantInfo = await sensorService.getPlantInfo(plantId);
      const currentSensorData = await sensorService.getLatestSensorData(plantId);
      const historicalData = await sensorService.getHistoricalData(plantId, 30);
      const wateringHistory = await sensorService.getWateringHistory(plantId, 20);
      const weatherForecast = await this.getWeatherForecast(timeHorizon);

      // Chuẩn bị dữ liệu đầu vào
      const optimizationInput = {
        plantInfo,
        currentSensorData,
        historicalData,
        wateringHistory,
        weatherForecast,
        timeHorizon,
        constraints: this.processConstraints(constraints),
        preferences: this.processPreferences(preferences)
      };

      // Chạy thuật toán tối ưu
      const optimizedSchedule = await this.runOptimization(algorithm, optimizationInput);

      // Đánh giá và tinh chỉnh kết quả
      const evaluatedSchedule = await this.evaluateSchedule(optimizedSchedule, optimizationInput);

      // Lưu kết quả để học
      await this.saveOptimizationResult(plantId, optimizationInput, evaluatedSchedule);

      return {
        plantId,
        algorithm,
        timeHorizon,
        schedule: evaluatedSchedule.schedule,
        performance: evaluatedSchedule.performance,
        recommendations: evaluatedSchedule.recommendations,
        constraints: optimizationInput.constraints,
        generatedAt: new Date().toISOString(),
        nextOptimization: this.calculateNextOptimizationTime(evaluatedSchedule.performance)
      };
    } catch (error) {
      console.error('Lỗi tối ưu lịch tưới:', error);
      return this.getFallbackSchedule(plantId, options);
    }
  }

  /**
   * Chạy thuật toán tối ưu
   */
  async runOptimization(algorithm, input) {
    const optimizationFunction = this.optimizationAlgorithms[algorithm];
    if (!optimizationFunction) {
      throw new Error(`Thuật toán ${algorithm} không được hỗ trợ`);
    }

    return await optimizationFunction(input);
  }

  /**
   * Thuật toán Genetic Algorithm
   */
  async geneticAlgorithm(input) {
    const {
      plantInfo,
      currentSensorData,
      weatherForecast,
      timeHorizon,
      constraints
    } = input;

    // Khởi tạo population
    const populationSize = 50;
    const generations = 20;
    let population = this.initializePopulation(populationSize, timeHorizon, constraints);

    for (let gen = 0; gen < generations; gen++) {
      // Đánh giá fitness cho từng cá thể
      const fitnessScores = await Promise.all(
        population.map(individual => this.calculateFitness(individual, input))
      );

      // Selection
      const selected = this.selection(population, fitnessScores);

      // Crossover và Mutation
      population = this.crossoverAndMutation(selected, constraints);

      // Elitism - giữ lại cá thể tốt nhất
      const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
      population[0] = population[bestIndex];
    }

    // Trả về cá thể tốt nhất
    const finalFitness = await Promise.all(
      population.map(individual => this.calculateFitness(individual, input))
    );
    const bestIndex = finalFitness.indexOf(Math.max(...finalFitness));

    return {
      schedule: population[bestIndex],
      fitness: finalFitness[bestIndex],
      algorithm: 'genetic',
      generations,
      populationSize
    };
  }

  /**
   * Thuật toán Reinforcement Learning
   */
  async reinforcementLearning(input) {
    const {
      plantInfo,
      currentSensorData,
      historicalData,
      wateringHistory,
      weatherForecast,
      timeHorizon,
      constraints
    } = input;

    // Q-Learning approach
    const states = this.defineStates(input);
    const actions = this.defineActions(constraints);
    const qTable = this.initializeQTable(states, actions);

    // Load existing Q-table if available
    const existingQTable = await this.loadQTable(input.plantInfo.id);
    if (existingQTable) {
      Object.assign(qTable, existingQTable);
    }

    // Simulate episodes for learning
    const episodes = 100;
    const learningRate = 0.1;
    const discountFactor = 0.9;
    const explorationRate = 0.1;

    for (let episode = 0; episode < episodes; episode++) {
      let currentState = this.getCurrentState(currentSensorData, weatherForecast[0]);
      const schedule = [];

      for (let day = 0; day < timeHorizon; day++) {
        // Choose action (epsilon-greedy)
        const action = Math.random() < explorationRate
          ? this.randomAction(actions)
          : this.bestAction(qTable, currentState, actions);

        // Simulate environment response
        const nextState = this.simulateNextState(currentState, action, weatherForecast[day]);
        const reward = this.calculateReward(currentState, action, nextState, plantInfo);

        // Update Q-table
        const currentQ = qTable[currentState]?.[action] || 0;
        const maxNextQ = Math.max(...Object.values(qTable[nextState] || {}));
        const newQ = currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);

        if (!qTable[currentState]) qTable[currentState] = {};
        qTable[currentState][action] = newQ;

        schedule.push({
          day: day + 1,
          action,
          state: currentState,
          reward,
          qValue: newQ
        });

        currentState = nextState;
      }
    }

    // Generate final schedule using learned Q-table
    const finalSchedule = this.generateScheduleFromQTable(qTable, input);

    // Save Q-table for future use
    await this.saveQTable(input.plantInfo.id, qTable);

    return {
      schedule: finalSchedule,
      qTable,
      algorithm: 'reinforcement_learning',
      episodes,
      learningRate,
      discountFactor
    };
  }

  /**
   * Thuật toán Rule-based
   */
  async ruleBasedOptimization(input) {
    const {
      plantInfo,
      currentSensorData,
      weatherForecast,
      timeHorizon,
      constraints
    } = input;

    const schedule = [];
    let currentMoisture = currentSensorData.soilMoisture || 50;

    for (let day = 0; day < timeHorizon; day++) {
      const dayWeather = weatherForecast[day];
      const daySchedule = {
        day: day + 1,
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
        irrigations: []
      };

      // Rule 1: Tưới nếu độ ẩm đất thấp
      if (currentMoisture < plantInfo.optimalSoilMoisture?.min || 40) {
        const wateringAmount = this.calculateWateringAmount(currentMoisture, plantInfo);
        daySchedule.irrigations.push({
          time: '07:00',
          amount: wateringAmount,
          reason: 'Độ ẩm đất thấp',
          priority: 'high'
        });
        currentMoisture += this.estimateMoistureIncrease(wateringAmount);
      }

      // Rule 2: Tưới thêm nếu thời tiết nóng và khô
      if (dayWeather.temperature > 30 && dayWeather.humidity < 40 && dayWeather.rainProbability < 20) {
        if (daySchedule.irrigations.length === 0) {
          daySchedule.irrigations.push({
            time: '06:30',
            amount: this.calculateWateringAmount(currentMoisture, plantInfo) * 0.7,
            reason: 'Thời tiết nóng và khô',
            priority: 'medium'
          });
        } else {
          // Thêm lần tưới chiều
          daySchedule.irrigations.push({
            time: '18:00',
            amount: this.calculateWateringAmount(currentMoisture, plantInfo) * 0.5,
            reason: 'Bổ sung do thời tiết nóng',
            priority: 'low'
          });
        }
      }

      // Rule 3: Giảm tưới nếu có mưa
      if (dayWeather.rainProbability > 60) {
        daySchedule.irrigations = daySchedule.irrigations.map(irrigation => ({
          ...irrigation,
          amount: irrigation.amount * 0.3,
          reason: irrigation.reason + ' (giảm do dự báo mưa)',
          modified: true
        }));
      }

      // Rule 4: Không tưới nếu đã đủ ẩm và có mưa
      if (currentMoisture > (plantInfo.optimalSoilMoisture?.max || 60) && dayWeather.rainProbability > 40) {
        daySchedule.irrigations = [];
        daySchedule.skipped = true;
        daySchedule.reason = 'Đất đã đủ ẩm và có khả năng mưa';
      }

      // Áp dụng constraints
      daySchedule.irrigations = this.applyConstraints(daySchedule.irrigations, constraints);

      // Cập nhật độ ẩm ước tính cho ngày tiếp theo
      const totalWatering = daySchedule.irrigations.reduce((sum, irr) => sum + irr.amount, 0);
      const moistureChange = this.estimateMoistureChange(currentMoisture, totalWatering, dayWeather);
      currentMoisture = Math.max(0, Math.min(100, currentMoisture + moistureChange));

      schedule.push(daySchedule);
    }

    return {
      schedule,
      algorithm: 'rule_based',
      rules: [
        'Tưới khi độ ẩm đất thấp',
        'Tưới thêm khi thời tiết nóng khô',
        'Giảm tưới khi có mưa',
        'Bỏ qua khi đất ẩm và có mưa'
      ]
    };
  }

  /**
   * Đánh giá hiệu suất lịch tưới
   */
  async evaluateSchedule(optimizedResult, input) {
    const { schedule } = optimizedResult;
    const { plantInfo, weatherForecast } = input;

    // Tính toán các metrics
    const performance = {
      waterEfficiency: this.calculateWaterEfficiency(schedule, weatherForecast),
      plantHealthScore: this.predictPlantHealth(schedule, plantInfo, weatherForecast),
      costEffectiveness: this.calculateCostEffectiveness(schedule),
      environmentalImpact: this.calculateEnvironmentalImpact(schedule, weatherForecast),
      userConvenience: this.calculateUserConvenience(schedule),
      overallScore: 0
    };

    // Tính điểm tổng thể (weighted average)
    performance.overallScore = (
      performance.waterEfficiency * 0.25 +
      performance.plantHealthScore * 0.30 +
      performance.costEffectiveness * 0.20 +
      performance.environmentalImpact * 0.15 +
      performance.userConvenience * 0.10
    );

    // Tạo khuyến nghị
    const recommendations = this.generateOptimizationRecommendations(schedule, performance, input);

    return {
      schedule,
      performance,
      recommendations,
      algorithm: optimizedResult.algorithm
    };
  }

  // Các hàm hỗ trợ cho Genetic Algorithm
  initializePopulation(size, timeHorizon, constraints) {
    const population = [];
    
    for (let i = 0; i < size; i++) {
      const individual = [];
      
      for (let day = 0; day < timeHorizon; day++) {
        const daySchedule = {
          day: day + 1,
          irrigations: []
        };

        // Random số lần tưới (0-3 lần/ngày)
        const numIrrigations = Math.floor(Math.random() * 4);
        
        for (let j = 0; j < numIrrigations; j++) {
          daySchedule.irrigations.push({
            time: this.randomTime(),
            amount: Math.floor(Math.random() * 500) + 50, // 50-550ml
            priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
          });
        }

        // Áp dụng constraints
        daySchedule.irrigations = this.applyConstraints(daySchedule.irrigations, constraints);
        individual.push(daySchedule);
      }
      
      population.push(individual);
    }
    
    return population;
  }

  async calculateFitness(individual, input) {
    const { plantInfo, weatherForecast } = input;
    
    let fitness = 100; // Base score
    let currentMoisture = input.currentSensorData.soilMoisture || 50;

    for (let day = 0; day < individual.length; day++) {
      const daySchedule = individual[day];
      const dayWeather = weatherForecast[day];

      // Tính tổng lượng nước tưới trong ngày
      const totalWater = daySchedule.irrigations.reduce((sum, irr) => sum + irr.amount, 0);

      // Ước tính độ ẩm sau khi tưới
      const moistureAfterWatering = currentMoisture + this.estimateMoistureIncrease(totalWater);
      
      // Ước tính độ ẩm cuối ngày (sau bay hơi)
      const moistureEndOfDay = moistureAfterWatering - this.estimateEvaporation(dayWeather);

      // Penalty nếu độ ẩm không tối ưu
      const optimalMin = plantInfo.optimalSoilMoisture?.min || 40;
      const optimalMax = plantInfo.optimalSoilMoisture?.max || 60;
      
      if (moistureEndOfDay < optimalMin) {
        fitness -= (optimalMin - moistureEndOfDay) * 2;
      } else if (moistureEndOfDay > optimalMax) {
        fitness -= (moistureEndOfDay - optimalMax) * 1.5;
      }

      // Penalty cho việc lãng phí nước
      if (dayWeather.rainProbability > 70 && totalWater > 100) {
        fitness -= totalWater * 0.1;
      }

      // Bonus cho việc tưới vào thời gian tối ưu
      daySchedule.irrigations.forEach(irrigation => {
        const hour = parseInt(irrigation.time.split(':')[0]);
        if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 19)) {
          fitness += 5;
        } else if (hour >= 11 && hour <= 15) {
          fitness -= 10; // Penalty tưới giữa trưa
        }
      });

      currentMoisture = Math.max(0, Math.min(100, moistureEndOfDay));
    }

    return Math.max(0, fitness);
  }

  selection(population, fitnessScores) {
    const selected = [];
    const totalFitness = fitnessScores.reduce((sum, score) => sum + score, 0);

    // Tournament selection
    for (let i = 0; i < population.length; i++) {
      const tournamentSize = 3;
      let bestIndex = Math.floor(Math.random() * population.length);
      let bestFitness = fitnessScores[bestIndex];

      for (let j = 1; j < tournamentSize; j++) {
        const candidateIndex = Math.floor(Math.random() * population.length);
        if (fitnessScores[candidateIndex] > bestFitness) {
          bestIndex = candidateIndex;
          bestFitness = fitnessScores[candidateIndex];
        }
      }

      selected.push([...population[bestIndex]]);
    }

    return selected;
  }

  crossoverAndMutation(population, constraints) {
    const newPopulation = [];
    const mutationRate = 0.1;

    for (let i = 0; i < population.length; i += 2) {
      const parent1 = population[i];
      const parent2 = population[i + 1] || population[0];

      // Crossover
      const crossoverPoint = Math.floor(Math.random() * parent1.length);
      const child1 = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
      const child2 = [...parent2.slice(0, crossoverPoint), ...parent1.slice(crossoverPoint)];

      // Mutation
      if (Math.random() < mutationRate) {
        this.mutate(child1, constraints);
      }
      if (Math.random() < mutationRate) {
        this.mutate(child2, constraints);
      }

      newPopulation.push(child1, child2);
    }

    return newPopulation.slice(0, population.length);
  }

  mutate(individual, constraints) {
    const dayIndex = Math.floor(Math.random() * individual.length);
    const day = individual[dayIndex];

    // Random mutation type
    const mutationType = Math.floor(Math.random() * 3);

    switch (mutationType) {
      case 0: // Change watering time
        if (day.irrigations.length > 0) {
          const irrigationIndex = Math.floor(Math.random() * day.irrigations.length);
          day.irrigations[irrigationIndex].time = this.randomTime();
        }
        break;
      case 1: // Change watering amount
        if (day.irrigations.length > 0) {
          const irrigationIndex = Math.floor(Math.random() * day.irrigations.length);
          day.irrigations[irrigationIndex].amount = Math.floor(Math.random() * 500) + 50;
        }
        break;
      case 2: // Add or remove irrigation
        if (Math.random() < 0.5 && day.irrigations.length > 0) {
          // Remove irrigation
          const removeIndex = Math.floor(Math.random() * day.irrigations.length);
          day.irrigations.splice(removeIndex, 1);
        } else if (day.irrigations.length < 3) {
          // Add irrigation
          day.irrigations.push({
            time: this.randomTime(),
            amount: Math.floor(Math.random() * 500) + 50,
            priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
          });
        }
        break;
    }

    // Apply constraints after mutation
    day.irrigations = this.applyConstraints(day.irrigations, constraints);
  }

  // Các hàm hỗ trợ cho Reinforcement Learning
  defineStates(input) {
    // Simplified state space
    const moistureLevels = ['low', 'medium', 'high'];
    const weatherConditions = ['dry', 'normal', 'wet'];
    const timeOfDay = ['morning', 'afternoon', 'evening'];

    const states = [];
    moistureLevels.forEach(moisture => {
      weatherConditions.forEach(weather => {
        timeOfDay.forEach(time => {
          states.push(`${moisture}_${weather}_${time}`);
        });
      });
    });

    return states;
  }

  defineActions(constraints) {
    const actions = [
      'no_watering',
      'light_watering_50ml',
      'medium_watering_150ml',
      'heavy_watering_300ml'
    ];

    // Filter actions based on constraints
    return actions.filter(action => this.isActionAllowed(action, constraints));
  }

  initializeQTable(states, actions) {
    const qTable = {};
    states.forEach(state => {
      qTable[state] = {};
      actions.forEach(action => {
        qTable[state][action] = 0;
      });
    });
    return qTable;
  }

  getCurrentState(sensorData, weather) {
    const moisture = sensorData.soilMoisture < 40 ? 'low' : 
                    sensorData.soilMoisture > 60 ? 'high' : 'medium';
    
    const weatherCondition = weather.rainProbability > 60 ? 'wet' :
                            weather.humidity < 40 ? 'dry' : 'normal';
    
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    return `${moisture}_${weatherCondition}_${timeOfDay}`;
  }

  randomAction(actions) {
    return actions[Math.floor(Math.random() * actions.length)];
  }

  bestAction(qTable, state, actions) {
    const stateActions = qTable[state] || {};
    let bestAction = actions[0];
    let bestValue = stateActions[bestAction] || 0;

    actions.forEach(action => {
      const value = stateActions[action] || 0;
      if (value > bestValue) {
        bestAction = action;
        bestValue = value;
      }
    });

    return bestAction;
  }

  simulateNextState(currentState, action, weather) {
    // Simplified state transition
    const [moisture, weatherCond, time] = currentState.split('_');
    
    let newMoisture = moisture;
    if (action.includes('watering')) {
      if (moisture === 'low') newMoisture = 'medium';
      else if (moisture === 'medium') newMoisture = 'high';
    }

    const newWeatherCond = weather.rainProbability > 60 ? 'wet' :
                          weather.humidity < 40 ? 'dry' : 'normal';

    return `${newMoisture}_${newWeatherCond}_${time}`;
  }

  calculateReward(currentState, action, nextState, plantInfo) {
    let reward = 0;
    
    const [currentMoisture] = currentState.split('_');
    const [nextMoisture] = nextState.split('_');

    // Reward for maintaining optimal moisture
    if (nextMoisture === 'medium') reward += 10;
    else if (nextMoisture === 'high' && currentMoisture === 'low') reward += 5;
    else if (nextMoisture === 'low') reward -= 15;
    else if (nextMoisture === 'high' && currentMoisture === 'high') reward -= 5;

    // Penalty for overwatering
    if (action.includes('heavy') && currentMoisture === 'high') reward -= 10;

    // Reward for water conservation
    if (action === 'no_watering' && currentMoisture === 'high') reward += 3;

    return reward;
  }

  generateScheduleFromQTable(qTable, input) {
    const { timeHorizon, currentSensorData, weatherForecast } = input;
    const schedule = [];

    for (let day = 0; day < timeHorizon; day++) {
      const dayWeather = weatherForecast[day];
      const state = this.getCurrentState(currentSensorData, dayWeather);
      const actions = Object.keys(qTable[state] || {});
      const bestAction = this.bestAction(qTable, state, actions);

      const daySchedule = {
        day: day + 1,
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
        irrigations: []
      };

      if (bestAction !== 'no_watering') {
        const amount = parseInt(bestAction.match(/\d+/)?.[0]) || 150;
        daySchedule.irrigations.push({
          time: '07:00',
          amount,
          reason: `AI recommendation (Q-Learning)`,
          qValue: qTable[state][bestAction],
          confidence: this.calculateActionConfidence(qTable[state])
        });
      }

      schedule.push(daySchedule);
    }

    return schedule;
  }

  // Các hàm hỗ trợ chung
  processConstraints(constraints) {
    return {
      maxWaterPerDay: constraints.maxWaterPerDay || 1000, // ml
      minTimeBetweenIrrigations: constraints.minTimeBetweenIrrigations || 4, // hours
      allowedTimes: constraints.allowedTimes || ['06:00-10:00', '17:00-20:00'],
      maxIrrigationsPerDay: constraints.maxIrrigationsPerDay || 3,
      waterPressure: constraints.waterPressure || 'normal',
      ...constraints
    };
  }

  processPreferences(preferences) {
    return {
      preferredTimes: preferences.preferredTimes || ['07:00', '18:00'],
      waterConservation: preferences.waterConservation || 'medium',
      automationLevel: preferences.automationLevel || 'high',
      notificationPreference: preferences.notificationPreference || 'important_only',
      ...preferences
    };
  }

  applyConstraints(irrigations, constraints) {
    let filtered = [...irrigations];

    // Giới hạn số lần tưới mỗi ngày
    if (filtered.length > constraints.maxIrrigationsPerDay) {
      filtered = filtered
        .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority))
        .slice(0, constraints.maxIrrigationsPerDay);
    }

    // Giới hạn tổng lượng nước mỗi ngày
    const totalWater = filtered.reduce((sum, irr) => sum + irr.amount, 0);
    if (totalWater > constraints.maxWaterPerDay) {
      const ratio = constraints.maxWaterPerDay / totalWater;
      filtered = filtered.map(irr => ({
        ...irr,
        amount: Math.round(irr.amount * ratio)
      }));
    }

    // Lọc theo thời gian cho phép
    filtered = filtered.filter(irr => this.isTimeAllowed(irr.time, constraints.allowedTimes));

    // Đảm bảo khoảng cách tối thiểu giữa các lần tưới
    filtered = this.enforceMinimumInterval(filtered, constraints.minTimeBetweenIrrigations);

    return filtered;
  }

  randomTime() {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  calculateWateringAmount(currentMoisture, plantInfo) {
    const optimalMoisture = (plantInfo.optimalSoilMoisture?.min + plantInfo.optimalSoilMoisture?.max) / 2 || 50;
    const deficit = Math.max(0, optimalMoisture - currentMoisture);
    
    // Base amount: 10ml per 1% moisture deficit
    let amount = deficit * 10;
    
    // Adjust based on plant type and size
    const plantMultiplier = this.getPlantWaterMultiplier(plantInfo.type);
    amount *= plantMultiplier;
    
    return Math.max(50, Math.min(500, Math.round(amount)));
  }

  estimateMoistureIncrease(waterAmount) {
    // Simplified: 1ml water = 0.1% moisture increase
    return waterAmount * 0.1;
  }

  estimateMoistureChange(currentMoisture, waterAmount, weather) {
    const increase = this.estimateMoistureIncrease(waterAmount);
    const evaporation = this.estimateEvaporation(weather);
    const rainIncrease = weather.rainProbability > 50 ? weather.rainProbability * 0.1 : 0;
    
    return increase - evaporation + rainIncrease;
  }

  estimateEvaporation(weather) {
    // Simplified evaporation model
    const baseEvaporation = 5; // 5% per day base
    const tempFactor = Math.max(0, (weather.temperature - 20) * 0.2);
    const humidityFactor = Math.max(0, (60 - weather.humidity) * 0.1);
    const windFactor = (weather.windSpeed || 5) * 0.1;
    
    return baseEvaporation + tempFactor + humidityFactor + windFactor;
  }

  // Các hàm đánh giá hiệu suất
  calculateWaterEfficiency(schedule, weatherForecast) {
    let totalWater = 0;
    let wastedWater = 0;

    schedule.forEach((day, index) => {
      const dayWater = day.irrigations.reduce((sum, irr) => sum + irr.amount, 0);
      totalWater += dayWater;

      // Tính nước lãng phí do mưa
      const weather = weatherForecast[index];
      if (weather.rainProbability > 70 && dayWater > 0) {
        wastedWater += dayWater * 0.5;
      }
    });

    return Math.max(0, 100 - (wastedWater / totalWater) * 100);
  }

  predictPlantHealth(schedule, plantInfo, weatherForecast) {
    let healthScore = 100;
    let currentMoisture = 50; // Assume starting moisture

    schedule.forEach((day, index) => {
      const dayWater = day.irrigations.reduce((sum, irr) => sum + irr.amount, 0);
      const weather = weatherForecast[index];
      
      // Update moisture
      currentMoisture += this.estimateMoistureChange(currentMoisture, dayWater, weather);
      currentMoisture = Math.max(0, Math.min(100, currentMoisture));

      // Check if moisture is in optimal range
      const optimalMin = plantInfo.optimalSoilMoisture?.min || 40;
      const optimalMax = plantInfo.optimalSoilMoisture?.max || 60;

      if (currentMoisture < optimalMin) {
        healthScore -= (optimalMin - currentMoisture) * 0.5;
      } else if (currentMoisture > optimalMax) {
        healthScore -= (currentMoisture - optimalMax) * 0.3;
      }
    });

    return Math.max(0, healthScore);
  }

  calculateCostEffectiveness(schedule) {
    const totalWater = schedule.reduce((sum, day) => 
      sum + day.irrigations.reduce((daySum, irr) => daySum + irr.amount, 0), 0
    );
    
    const totalIrrigations = schedule.reduce((sum, day) => sum + day.irrigations.length, 0);
    
    // Assume cost factors
    const waterCost = totalWater * 0.001; // $0.001 per ml
    const operationCost = totalIrrigations * 0.1; // $0.1 per irrigation
    const totalCost = waterCost + operationCost;
    
    // Score based on efficiency (lower cost = higher score)
    return Math.max(0, 100 - totalCost * 10);
  }

  calculateEnvironmentalImpact(schedule, weatherForecast) {
    let impactScore = 100;
    
    schedule.forEach((day, index) => {
      const dayWater = day.irrigations.reduce((sum, irr) => sum + irr.amount, 0);
      const weather = weatherForecast[index];
      
      // Penalty for watering during rain
      if (weather.rainProbability > 60 && dayWater > 0) {
        impactScore -= 10;
      }
      
      // Penalty for excessive water use
      if (dayWater > 500) {
        impactScore -= (dayWater - 500) * 0.02;
      }
    });
    
    return Math.max(0, impactScore);
  }

  calculateUserConvenience(schedule) {
    let convenienceScore = 100;
    
    schedule.forEach(day => {
      // Penalty for too many irrigations per day
      if (day.irrigations.length > 2) {
        convenienceScore -= (day.irrigations.length - 2) * 5;
      }
      
      // Penalty for inconvenient times
      day.irrigations.forEach(irrigation => {
        const hour = parseInt(irrigation.time.split(':')[0]);
        if (hour >= 22 || hour <= 5) {
          convenienceScore -= 10; // Night time penalty
        } else if (hour >= 11 && hour <= 15) {
          convenienceScore -= 5; // Midday penalty
        }
      });
    });
    
    return Math.max(0, convenienceScore);
  }

  generateOptimizationRecommendations(schedule, performance, input) {
    const recommendations = [];
    
    // Water efficiency recommendations
    if (performance.waterEfficiency < 70) {
      recommendations.push({
        type: 'water_efficiency',
        priority: 'high',
        title: 'Cải thiện hiệu quả sử dụng nước',
        message: 'Lịch tưới hiện tại có thể lãng phí nước',
        actions: [
          'Kiểm tra dự báo thời tiết trước khi tưới',
          'Giảm lượng nước tưới khi độ ẩm không khí cao',
          'Sử dụng cảm biến độ ẩm đất để tưới chính xác hơn'
        ]
      });
    }
    
    // Plant health recommendations
    if (performance.plantHealthScore < 80) {
      recommendations.push({
        type: 'plant_health',
        priority: 'high',
        title: 'Tối ưu hóa sức khỏe cây trồng',
        message: 'Lịch tưới cần điều chỉnh để cải thiện sức khỏe cây',
        actions: [
          'Tăng tần suất kiểm tra độ ẩm đất',
          'Điều chỉnh lượng nước theo giai đoạn phát triển của cây',
          'Xem xét bổ sung dinh dưỡng cùng với việc tưới'
        ]
      });
    }
    
    // Cost optimization recommendations
    if (performance.costEffectiveness < 70) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'medium',
        title: 'Tối ưu hóa chi phí',
        message: 'Có thể giảm chi phí vận hành',
        actions: [
          'Giảm số lần tưới bằng cách tăng lượng nước mỗi lần',
          'Tưới vào thời gian điện rẻ hơn',
          'Sử dụng nước mưa khi có thể'
        ]
      });
    }
    
    return recommendations;
  }

  // Các hàm hỗ trợ khác
  async getWeatherForecast(days) {
    // Mô phỏng dữ liệu thời tiết
    const forecast = [];
    for (let i = 0; i < days; i++) {
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        rainProbability: Math.random() * 100,
        windSpeed: 2 + Math.random() * 8
      });
    }
    return forecast;
  }

  getPriorityValue(priority) {
    const values = { low: 1, medium: 2, high: 3 };
    return values[priority] || 1;
  }

  isTimeAllowed(time, allowedTimes) {
    const hour = parseInt(time.split(':')[0]);
    return allowedTimes.some(range => {
      const [start, end] = range.split('-').map(t => parseInt(t.split(':')[0]));
      return hour >= start && hour <= end;
    });
  }

  enforceMinimumInterval(irrigations, minHours) {
    if (irrigations.length <= 1) return irrigations;
    
    const sorted = irrigations.sort((a, b) => a.time.localeCompare(b.time));
    const filtered = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const prevTime = this.timeToMinutes(filtered[filtered.length - 1].time);
      const currTime = this.timeToMinutes(sorted[i].time);
      
      if (currTime - prevTime >= minHours * 60) {
        filtered.push(sorted[i]);
      }
    }
    
    return filtered;
  }

  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getPlantWaterMultiplier(plantType) {
    const multipliers = {
      'tomato': 1.2,
      'pepper': 1.0,
      'lettuce': 0.8,
      'herb': 0.9,
      'flower': 1.1
    };
    return multipliers[plantType?.toLowerCase()] || 1.0;
  }

  isActionAllowed(action, constraints) {
    // Implement action filtering based on constraints
    return true; // Simplified
  }

  calculateActionConfidence(stateActions) {
    const values = Object.values(stateActions);
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    
    return maxValue > 0 ? (maxValue - avgValue) / maxValue : 0;
  }

  calculateNextOptimizationTime(performance) {
    // Schedule next optimization based on performance
    let hoursToAdd = 24; // Default daily
    
    if (performance.overallScore < 60) {
      hoursToAdd = 12; // More frequent if performance is poor
    } else if (performance.overallScore > 90) {
      hoursToAdd = 48; // Less frequent if performance is excellent
    }
    
    return new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
  }

  async saveOptimizationResult(plantId, input, result) {
    // Save to learning data for future improvements
    this.learningData.push({
      plantId,
      timestamp: new Date().toISOString(),
      input: {
        plantInfo: input.plantInfo,
        sensorData: input.currentSensorData,
        weatherData: input.weatherForecast
      },
      result: {
        schedule: result.schedule,
        performance: result.performance,
        algorithm: result.algorithm
      }
    });
    
    // Keep only recent data
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-1000);
    }
  }

  async loadQTable(plantId) {
    // In real implementation, load from database
    return null;
  }

  async saveQTable(plantId, qTable) {
    // In real implementation, save to database
    console.log(`Saved Q-table for plant ${plantId}`);
  }

  getFallbackSchedule(plantId, options) {
    const { timeHorizon = 7 } = options;
    const schedule = [];
    
    for (let day = 0; day < timeHorizon; day++) {
      schedule.push({
        day: day + 1,
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
        irrigations: [{
          time: '07:00',
          amount: 200,
          reason: 'Lịch tưới mặc định',
          priority: 'medium'
        }]
      });
    }
    
    return {
      plantId,
      algorithm: 'fallback',
      timeHorizon,
      schedule,
      performance: {
        waterEfficiency: 70,
        plantHealthScore: 75,
        costEffectiveness: 70,
        environmentalImpact: 75,
        userConvenience: 80,
        overallScore: 74
      },
      recommendations: [{
        type: 'system_error',
        priority: 'medium',
        title: 'Sử dụng lịch tưới dự phòng',
        message: 'Hệ thống tối ưu hóa gặp lỗi, sử dụng lịch tưới cơ bản',
        actions: ['Kiểm tra hệ thống', 'Theo dõi thủ công']
      }],
      generatedAt: new Date().toISOString(),
      nextOptimization: new Date(Date.now() + 24 * 60 * 60 * 1000),
      error: 'Fallback schedule due to optimization error'
    };
  }
}

module.exports = new IrrigationOptimizationService();