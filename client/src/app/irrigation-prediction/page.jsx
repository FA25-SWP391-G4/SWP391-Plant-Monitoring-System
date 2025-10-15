'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import IrrigationPredictionDashboard from '../../components/IrrigationPredictionDashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Droplets, ArrowLeft, Settings } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

/**
 * Irrigation Prediction Page
 * Main page for AI-powered irrigation prediction dashboard
 */
const IrrigationPredictionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [availablePlants, setAvailablePlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get plant ID from URL params
  useEffect(() => {
    const plantId = searchParams.get('plantId');
    const plantName = searchParams.get('plantName');
    
    if (plantId) {
      setSelectedPlantId(parseInt(plantId));
      setSelectedPlantName(plantName || `Plant ${plantId}`);
    }
  }, [searchParams]);

  // Mock function to load available plants
  // In a real implementation, this would fetch from your plants API
  const loadAvailablePlants = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockPlants = [
        { id: 1, name: 'Tomato Plant #1', type: 'tomato', location: 'Greenhouse A' },
        { id: 2, name: 'Basil Plant #2', type: 'basil', location: 'Indoor Garden' },
        { id: 3, name: 'Lettuce Plant #3', type: 'lettuce', location: 'Hydroponic System' },
        { id: 4, name: 'Pepper Plant #4', type: 'pepper', location: 'Greenhouse B' },
        { id: 5, name: 'Mint Plant #5', type: 'mint', location: 'Window Garden' }
      ];

      setAvailablePlants(mockPlants);

      // If no plant is selected, select the first one
      if (!selectedPlantId && mockPlants.length > 0) {
        setSelectedPlantId(mockPlants[0].id);
        setSelectedPlantName(mockPlants[0].name);
      }

    } catch (error) {
      console.error('Failed to load plants:', error);
      setError('Failed to load available plants');
      toast({
        title: "Error",
        description: "Failed to load available plants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load plants on component mount
  useEffect(() => {
    loadAvailablePlants();
  }, []);

  // Handle plant selection change
  const handlePlantChange = (plantId) => {
    const plant = availablePlants.find(p => p.id === parseInt(plantId));
    if (plant) {
      setSelectedPlantId(plant.id);
      setSelectedPlantName(plant.name);
      
      // Update URL params
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('plantId', plant.id.toString());
      newSearchParams.set('plantName', plant.name);
      router.push(`/irrigation-prediction?${newSearchParams.toString()}`);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Droplets className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading irrigation prediction dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center space-x-2">
              <Droplets className="w-5 h-5" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={loadAvailablePlants} className="flex-1">
                Retry
              </Button>
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No plants available
  if (availablePlants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <span>No Plants Available</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              No plants are available for irrigation prediction. Please add some plants first.
            </p>
            <div className="flex space-x-2">
              <Button onClick={() => router.push('/plants')} className="flex-1">
                Add Plants
              </Button>
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div className="flex items-center space-x-3">
              <Droplets className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Irrigation Prediction
              </h1>
            </div>
          </div>

          {/* Plant Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Plant:</span>
              <Select value={selectedPlantId?.toString()} onValueChange={handlePlantChange}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a plant" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{plant.name}</p>
                          <p className="text-xs text-gray-500">{plant.location}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto">
        {selectedPlantId ? (
          <IrrigationPredictionDashboard
            plantId={selectedPlantId}
            plantName={selectedPlantName}
          />
        ) : (
          <div className="flex items-center justify-center py-20">
            <Card className="w-full max-w-md">
              <CardContent className="text-center p-8">
                <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Please select a plant to view irrigation predictions</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default IrrigationPredictionPage;