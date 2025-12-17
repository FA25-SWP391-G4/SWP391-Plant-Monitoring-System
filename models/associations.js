// Model associations setup
const User = require('./User');
const Plan = require('./Plan');
const Subscription = require('./Subscription');
const Payment = require('./Payment');

// Set up associations
const setupAssociations = () => {
  // Plan associations
  Plan.hasMany(Subscription, {
    foreignKey: 'planId',
    sourceKey: 'id',
    as: 'subscriptions'
  });

  // Subscription associations
  Subscription.belongsTo(Plan, {
    foreignKey: 'planId',
    targetKey: 'id',
    as: 'plan'
  });

  // Note: User and Payment are plain JS classes, not Sequelize models
  // We'll handle their relationships through custom methods
};

module.exports = {
  setupAssociations,
  User,
  Plan,
  Subscription,
  Payment
};