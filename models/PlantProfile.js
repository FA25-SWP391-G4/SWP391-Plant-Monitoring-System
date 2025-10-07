const { pool } = require('../config/db');

class PlantProfile {
    constructor(profileData) {
        this.profile_id = profileData.profile_id;
        this.species_name = profileData.species_name;
        this.description = profileData.description;
        this.ideal_moisture = profileData.ideal_moisture;
    }

    // Static method to find all plant profiles
    static async findAll() {
        try {
            const query = 'SELECT * FROM Plant_Profiles ORDER BY species_name';
            const result = await pool.query(query);
            return result.rows.map(row => new PlantProfile(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find plant profile by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM Plant_Profiles WHERE profile_id = $1';
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new PlantProfile(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find plant profile by species name
    static async findBySpeciesName(speciesName) {
        try {
            const query = 'SELECT * FROM Plant_Profiles WHERE LOWER(species_name) = LOWER($1)';
            const result = await pool.query(query, [speciesName]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new PlantProfile(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Create or update plant profile
    async save() {
        try {
            if (this.profile_id) {
                // Update existing profile
                const query = `
                    UPDATE Plant_Profiles 
                    SET species_name = $1, description = $2, ideal_moisture = $3
                    WHERE profile_id = $4
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.species_name,
                    this.description,
                    this.ideal_moisture,
                    this.profile_id
                ]);
                
                const updatedProfile = new PlantProfile(result.rows[0]);
                Object.assign(this, updatedProfile);
                return this;
            } else {
                // Create new profile
                const query = `
                    INSERT INTO Plant_Profiles (species_name, description, ideal_moisture)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.species_name,
                    this.description,
                    this.ideal_moisture
                ]);
                
                const newProfile = new PlantProfile(result.rows[0]);
                Object.assign(this, newProfile);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Delete plant profile
    async delete() {
        try {
            if (!this.profile_id) {
                throw new Error('Cannot delete profile without ID');
            }

            const query = 'DELETE FROM Plant_Profiles WHERE profile_id = $1';
            await pool.query(query, [this.profile_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            profile_id: this.profile_id,
            species_name: this.species_name,
            description: this.description,
            ideal_moisture: this.ideal_moisture
        };
    }
}

module.exports = PlantProfile;
