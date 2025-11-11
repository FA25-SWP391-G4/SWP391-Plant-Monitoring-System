const { By } = require('selenium-webdriver');
const BasePage = require('../utils/BasePage');

class AdminDashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Navigation menu locators
    this.sidebarMenu = By.css('.admin-sidebar, .sidebar, [data-testid="admin-sidebar"]');
    this.userManagementLink = By.css('a[href*="admin/users"], [data-testid="user-management"]');
    this.reportsLink = By.css('a[href*="admin/reports"], [data-testid="reports-link"]');
    this.settingsLink = By.css('a[href*="admin/settings"], [data-testid="settings-link"]');
    this.logsLink = By.css('a[href*="admin/logs"], [data-testid="logs-link"]');
    this.backupLink = By.css('a[href*="admin/backup"], [data-testid="backup-link"]');
    
    // Dashboard metrics
    this.totalUsersCard = By.css('.total-users, [data-testid="total-users"]');
    this.totalDevicesCard = By.css('.total-devices, [data-testid="total-devices"]');
    this.systemHealthCard = By.css('.system-health, [data-testid="system-health"]');
    this.revenueCard = By.css('.revenue, [data-testid="revenue-card"]');
    
    // Charts and graphs
    this.userGrowthChart = By.css('.user-growth-chart, [data-testid="user-growth-chart"]');
    this.revenueChart = By.css('.revenue-chart, [data-testid="revenue-chart"]');
    
    // Quick actions
    this.quickActions = By.css('.quick-actions, [data-testid="quick-actions"]');
    this.createUserButton = By.css('.create-user-btn, [data-testid="create-user"]');
    this.backupButton = By.css('.backup-btn, [data-testid="backup-database"]');
    
    // Header elements
    this.adminTitle = By.css('.admin-title, h1');
    this.logoutButton = By.css('.logout-btn, [data-testid="logout"]');
    this.profileDropdown = By.css('.profile-dropdown, [data-testid="profile-menu"]');
  }

  /**
   * Navigate to admin dashboard
   */
  async navigateToAdminDashboard() {
    await this.navigateTo(`${process.env.APP_URL || 'http://localhost:3000'}/admin/dashboard`);
  }

  /**
   * Check if admin dashboard is displayed
   */
  async isAdminDashboardDisplayed() {
    return await this.isDisplayed(this.sidebarMenu) && 
           await this.isDisplayed(this.adminTitle);
  }

  /**
   * Navigate to user management
   */
  async goToUserManagement() {
    await this.clickElement(this.userManagementLink);
    await this.waitForUrlContains('/admin/users');
  }

  /**
   * Navigate to reports
   */
  async goToReports() {
    await this.clickElement(this.reportsLink);
    await this.waitForUrlContains('/admin/reports');
  }

  /**
   * Navigate to system settings
   */
  async goToSettings() {
    await this.clickElement(this.settingsLink);
    await this.waitForUrlContains('/admin/settings');
  }

  /**
   * Navigate to system logs
   */
  async goToLogs() {
    await this.clickElement(this.logsLink);
    await this.waitForUrlContains('/admin/logs');
  }

  /**
   * Navigate to backup management
   */
  async goToBackup() {
    await this.clickElement(this.backupLink);
    await this.waitForUrlContains('/admin/backup');
  }

  /**
   * Get total users count from dashboard
   */
  async getTotalUsersCount() {
    if (await this.isDisplayed(this.totalUsersCard)) {
      const text = await this.getText(this.totalUsersCard);
      return parseInt(text.replace(/\D/g, '')) || 0;
    }
    return null;
  }

  /**
   * Get total devices count from dashboard
   */
  async getTotalDevicesCount() {
    if (await this.isDisplayed(this.totalDevicesCard)) {
      const text = await this.getText(this.totalDevicesCard);
      return parseInt(text.replace(/\D/g, '')) || 0;
    }
    return null;
  }

  /**
   * Get system health status
   */
  async getSystemHealthStatus() {
    if (await this.isDisplayed(this.systemHealthCard)) {
      return await this.getText(this.systemHealthCard);
    }
    return null;
  }

  /**
   * Get revenue information
   */
  async getRevenueInfo() {
    if (await this.isDisplayed(this.revenueCard)) {
      return await this.getText(this.revenueCard);
    }
    return null;
  }

  /**
   * Check if charts are loaded
   */
  async areChartsLoaded() {
    return await this.isDisplayed(this.userGrowthChart) && 
           await this.isDisplayed(this.revenueChart);
  }

  /**
   * Click create user quick action
   */
  async clickCreateUser() {
    await this.clickElement(this.createUserButton);
  }

  /**
   * Click backup database quick action
   */
  async clickBackupDatabase() {
    await this.clickElement(this.backupButton);
  }

  /**
   * Logout from admin panel
   */
  async logout() {
    if (await this.isDisplayed(this.profileDropdown)) {
      await this.clickElement(this.profileDropdown);
    }
    await this.clickElement(this.logoutButton);
    await this.waitForUrlContains('/login');
  }

  /**
   * Verify all dashboard elements are present
   */
  async verifyDashboardElements() {
    const elements = [
      { name: 'Sidebar Menu', locator: this.sidebarMenu },
      { name: 'Admin Title', locator: this.adminTitle },
      { name: 'User Management Link', locator: this.userManagementLink },
      { name: 'Reports Link', locator: this.reportsLink },
      { name: 'Settings Link', locator: this.settingsLink },
      { name: 'Total Users Card', locator: this.totalUsersCard },
      { name: 'Quick Actions', locator: this.quickActions }
    ];

    const results = [];
    for (const element of elements) {
      const isPresent = await this.isDisplayed(element.locator);
      results.push({ name: element.name, present: isPresent });
    }

    return results;
  }

  /**
   * Get all sidebar navigation links
   */
  async getSidebarLinks() {
    const links = [];
    const navigationLinks = [
      { name: 'User Management', locator: this.userManagementLink },
      { name: 'Reports', locator: this.reportsLink },
      { name: 'Settings', locator: this.settingsLink },
      { name: 'Logs', locator: this.logsLink },
      { name: 'Backup', locator: this.backupLink }
    ];

    for (const link of navigationLinks) {
      if (await this.isDisplayed(link.locator)) {
        const text = await this.getText(link.locator);
        links.push({ name: link.name, text, visible: true });
      } else {
        links.push({ name: link.name, visible: false });
      }
    }

    return links;
  }
}

module.exports = AdminDashboardPage;