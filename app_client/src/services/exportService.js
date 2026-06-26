import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axiosClient from './axiosClient';

/**
 * exportService - Service for exporting watering history to CSV
 * 
 * Features:
 * - Downloads CSV from backend API
 * - Saves to device FileSystem
 * - Triggers native share dialog
 * 
 * Note: Requires GET /api/reports/watering-history/:plantId/export endpoint
 */

export const exportWateringHistory = async (plantId, startDate, endDate) => {
  try {
    console.log('[exportService] Exporting watering history for plant:', plantId);

    // Build query string
    let url = `/api/reports/watering-history/${plantId}/export`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Download CSV from backend
    const response = await axiosClient.get(url, {
      responseType: 'arraybuffer',
    });

    if (!response.data) {
      return {
        success: false,
        error: 'No data received from server',
      };
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `watering-history-${plantId}-${timestamp}.csv`;

    // Save to FileSystem
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(
      filePath,
      String.fromCharCode.apply(null, new Uint8Array(response.data)),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log('[exportService] File saved to:', filePath);

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    console.error('[exportService] Export error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to export data',
    };
  }
};

export const shareExportedFile = async (filePath, fileName) => {
  try {
    console.log('[exportService] Sharing file:', fileName);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Sharing not available on this device',
      };
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: `Share ${fileName}`,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[exportService] Share error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to share file',
    };
  }
};