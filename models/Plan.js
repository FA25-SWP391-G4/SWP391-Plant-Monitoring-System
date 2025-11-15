/**
 * ============================================================================
 * PLAN MODEL - SUBSCRIPTION PLAN MANAGEMENT
 * ============================================================================
 * 
 * SUPPORTS SUBSCRIPTION SYSTEM:
 * - Public plan access (Basic, Premium, Ultimate)
 * - Admin-only plan management
 * - Dynamic pricing for premium page
 * - Plan feature management
 * - Access control and validation
 * 
 * PLAN STRUCTURE:
 * - id: Unique plan identifier
 * - name: Plan name (Basic, Premium, Ultimate, Admin)
 * - description: Plan description for users
 * - price_monthly: Monthly pricing in VND
 * - price_yearly: Annual pricing in VND
 * - price_lifetime: One-time lifetime payment (optional)
 * - features: JSON array of plan features
 * - max_plants: Maximum plants allowed (NULL = unlimited)
 * - is_admin_only: Admin access restriction flag
 * - is_active: Plan availability status
 */

const { pool } = require('../config/db');

class Plan {
    constructor(planData) {
        this.id = planData.id;
        this.name = planData.name;
        this.description = planData.description;
        this.priceMonthly = parseFloat(planData.price_monthly) || 0;
        this.priceYearly = parseFloat(planData.price_yearly) || 0;
        this.priceLifetime = planData.price_lifetime ? parseFloat(planData.price_lifetime) : null;
        this.features = planData.features || [];
        this.maxPlants = planData.max_plants;
        this.isAdminOnly = planData.is_admin_only || false;
        this.isActive = planData.is_active !== false;
        this.createdAt = planData.created_at;
        this.updatedAt = planData.updated_at;
    }

    /**
     * FIND ALL PLANS - ADMIN OVERVIEW
     * Retrieves all plans for administrative management
     */
    static async findAll() {
        try {
            const query = `
                SELECT * FROM plans 
                ORDER BY id ASC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Plan(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * FIND PLAN BY ID
     * Retrieves specific plan by ID with access control
     */
    static async findById(id) {
        try {
            const query = `
                SELECT * FROM plans 
                WHERE id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Plan(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET PUBLIC PLANS
     * Retrieves all non-admin plans that are active
     */
    static async getPublicPlans() {
        try {
            const query = `
                SELECT * FROM plans 
                WHERE is_active = true AND is_admin_only = false
                ORDER BY id ASC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Plan(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET ADMIN PLANS
     * Retrieves admin-only plans
     */
    static async getAdminPlans() {
        try {
            const query = `
                SELECT * FROM plans 
                WHERE is_active = true AND is_admin_only = true
                ORDER BY id ASC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Plan(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET PLAN BY NAME
     * Retrieves plan by name (case-sensitive)
     */
    static async getPlanByName(name) {
        try {
            const query = `
                SELECT * FROM plans 
                WHERE name = $1 AND is_active = true
            `;
            const result = await pool.query(query, [name]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Plan(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * CREATE NEW PLAN
     * Creates a new subscription plan (admin only)
     */
    static async create(planData) {
        try {
            const {
                name,
                description,
                priceMonthly = 0,
                priceYearly = 0,
                priceLifetime = null,
                features = '[]',
                maxPlants = null,
                isAdminOnly = false,
                isActive = true
            } = planData;

            const query = `
                INSERT INTO plans (
                    name, description, price_monthly, price_yearly, price_lifetime,
                    features, max_plants, is_admin_only, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;
            
            const values = [
                name,
                description,
                priceMonthly,
                priceYearly,
                priceLifetime,
                JSON.stringify(features),
                maxPlants,
                isAdminOnly,
                isActive
            ];
            
            const result = await pool.query(query, values);
            return new Plan(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * UPDATE PLAN
     * Updates existing plan data
     */
    async update(updateData) {
        try {
            const updates = [];
            const values = [];
            let paramCount = 1;

            // Build dynamic update query
            if (updateData.name !== undefined) {
                updates.push(`name = $${paramCount++}`);
                values.push(updateData.name);
            }
            if (updateData.description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(updateData.description);
            }
            if (updateData.priceMonthly !== undefined) {
                updates.push(`price_monthly = $${paramCount++}`);
                values.push(updateData.priceMonthly);
            }
            if (updateData.priceYearly !== undefined) {
                updates.push(`price_yearly = $${paramCount++}`);
                values.push(updateData.priceYearly);
            }
            if (updateData.priceLifetime !== undefined) {
                updates.push(`price_lifetime = $${paramCount++}`);
                values.push(updateData.priceLifetime);
            }
            if (updateData.features !== undefined) {
                updates.push(`features = $${paramCount++}`);
                values.push(JSON.stringify(updateData.features));
            }
            if (updateData.maxPlants !== undefined) {
                updates.push(`max_plants = $${paramCount++}`);
                values.push(updateData.maxPlants);
            }
            if (updateData.isAdminOnly !== undefined) {
                updates.push(`is_admin_only = $${paramCount++}`);
                values.push(updateData.isAdminOnly);
            }
            if (updateData.isActive !== undefined) {
                updates.push(`is_active = $${paramCount++}`);
                values.push(updateData.isActive);
            }

            if (updates.length === 0) {
                return this;
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(this.id);

            const query = `
                UPDATE plans 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(query, values);
            
            if (result.rows.length > 0) {
                const updated = result.rows[0];
                Object.assign(this, {
                    name: updated.name,
                    description: updated.description,
                    priceMonthly: parseFloat(updated.price_monthly),
                    priceYearly: parseFloat(updated.price_yearly),
                    priceLifetime: updated.price_lifetime ? parseFloat(updated.price_lifetime) : null,
                    features: updated.features,
                    maxPlants: updated.max_plants,
                    isAdminOnly: updated.is_admin_only,
                    isActive: updated.is_active,
                    updatedAt: updated.updated_at
                });
            }

            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * DELETE PLAN
     * Soft delete by setting is_active to false
     */
    async delete() {
        try {
            const query = `
                UPDATE plans 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, [this.id]);
            
            if (result.rows.length > 0) {
                this.isActive = false;
                this.updatedAt = result.rows[0].updated_at;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * CHECK ACCESS
     * Validates if user can access this plan
     */
    canAccess(userRole) {
        if (!this.isActive) return false;
        if (this.isAdminOnly && userRole !== 'Admin') return false;
        return true;
    }

    /**
     * GET PRICE FOR SUBSCRIPTION TYPE
     * Returns appropriate price based on subscription type
     */
    getPriceForType(subscriptionType) {
        switch (subscriptionType) {
            case 'monthly':
                return this.priceMonthly;
            case 'yearly':
                return this.priceYearly;
            case 'lifetime':
                return this.priceLifetime;
            default:
                return null;
        }
    }

    /**
     * CONVERT TO JSON
     * Clean JSON representation for API responses
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            priceMonthly: this.priceMonthly,
            priceYearly: this.priceYearly,
            priceLifetime: this.priceLifetime,
            features: this.features,
            maxPlants: this.maxPlants,
            isAdminOnly: this.isAdminOnly,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * VALIDATION METHODS
     */
    static validateName(name) {
        if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
            throw new Error('Plan name must be between 1 and 100 characters');
        }
        return true;
    }

    static validatePrice(price) {
        if (price !== null && (typeof price !== 'number' || price < 0)) {
            throw new Error('Price must be a non-negative number or null');
        }
        return true;
    }

    static validateFeatures(features) {
        if (features && !Array.isArray(features)) {
            throw new Error('Features must be an array');
        }
        return true;
    }
}

module.exports = Plan;