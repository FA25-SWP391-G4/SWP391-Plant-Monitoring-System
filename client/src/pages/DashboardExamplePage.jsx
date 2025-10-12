import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardWidget from '../components/DashboardWidget';
import PlantStatusCard from '../components/PlantStatusCard';
import SensorStatsCard from '../components/SensorStatsCard';
import { Button } from '../components/ui/Button';
import { FiPlus, FiRefreshCw, FiDroplet, FiSun, FiThermometer, FiWind } from 'react-icons/fi';

/**
 * Dashboard Example Page
 * 
 * This is an example of how to use the various dashboard components together
 */
function DashboardExamplePage() {
  // Sample data for the example
  const plants = [
    {
      id: 1,
      name: 'Snake Plant',
      species: 'Sansevieria trifasciata',
      imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54c7f8ed372',
      metrics: {
        moisture: 42,
        light: 75,
        temperature: 22
      },
      status: 'healthy',
      lastWatered: '2 days ago'
    },
    {
      id: 2,
      name: 'Peace Lily',
      species: 'Spathiphyllum wallisii',
      imageUrl: 'https://images.unsplash.com/photo-1567748157439-651aca2ff064',
      metrics: {
        moisture: 18,
        light: 53,
        temperature: 24
      },
      status: 'needsWater',
      lastWatered: '5 days ago'
    },
    {
      id: 3,
      name: 'Fiddle Leaf Fig',
      species: 'Ficus lyrata',
      imageUrl: 'https://images.unsplash.com/photo-1602491674275-316d95792461',
      metrics: {
        moisture: 38,
        light: 22,
        temperature: 21
      },
      status: 'needsLight',
      lastWatered: '3 days ago'
    },
    {
      id: 4,
      name: 'Monstera',
      species: 'Monstera deliciosa',
      imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b',
      metrics: {
        moisture: 45,
        light: 68,
        temperature: 29
      },
      status: 'temperatureAlert',
      lastWatered: '1 day ago'
    }
  ];

  const handlePlantClick = (plantId) => {
    console.log(`Plant clicked: ${plantId}`);
    // Navigate to plant detail page
  };

  const handleWaterPlant = (plantId) => {
    console.log(`Water plant: ${plantId}`);
    // Send watering command to backend
  };

  return (
    <DashboardLayout 
      title="Plant Dashboard" 
      subtitle="Monitor and manage your plants"
      actions={
        <div className="flex gap-2">
          <Button>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
          <Button variant="default">
            <FiPlus className="mr-2" /> Add Plant
          </Button>
        </div>
      }
    >
      {/* Plant Status Section */}
      <DashboardWidget 
        title="Your Plants" 
        description="Current status of your plants"
        action={
          <Button variant="outline" size="sm">
            View All
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plants.map(plant => (
            <PlantStatusCard
              key={plant.id}
              plantId={plant.id}
              name={plant.name}
              species={plant.species}
              imageUrl={plant.imageUrl}
              metrics={plant.metrics}
              status={plant.status}
              lastWatered={plant.lastWatered}
              onClick={handlePlantClick}
              onWater={handleWaterPlant}
            />
          ))}
        </div>
      </DashboardWidget>

      {/* Sensor Statistics Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Environmental Sensors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SensorStatsCard
            title="Soil Moisture"
            icon={<FiDroplet />}
            value={42}
            unit="%"
            minValue={18}
            maxValue={75}
            avgValue={48}
            thresholds={{
              min: 20,
              max: 80,
              warning: 15,
              danger: 10
            }}
            timestamp="Today, 12:45 PM"
            trend="stable"
          />
          
          <SensorStatsCard
            title="Light Level"
            icon={<FiSun />}
            value={68}
            unit="%"
            minValue={22}
            maxValue={95}
            avgValue={63}
            thresholds={{
              min: 30,
              warning: 15,
              danger: 10
            }}
            timestamp="Today, 12:45 PM"
            trend="up"
          />
          
          <SensorStatsCard
            title="Temperature"
            icon={<FiThermometer />}
            value={24}
            unit="°C"
            minValue={18}
            maxValue={29}
            avgValue={23}
            thresholds={{
              warning: [15, 28],
              danger: [10, 32]
            }}
            timestamp="Today, 12:45 PM"
            trend="up"
          />
          
          <SensorStatsCard
            title="Humidity"
            icon={<FiWind />}
            value={58}
            unit="%"
            minValue={35}
            maxValue={75}
            avgValue={55}
            thresholds={{
              min: 40,
              max: 80
            }}
            timestamp="Today, 12:45 PM"
            trend="down"
          />
        </div>
      </div>

      {/* Additional Dashboard Widgets could be added here */}
    </DashboardLayout>
  );
}

export default DashboardExamplePage;