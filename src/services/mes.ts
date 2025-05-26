/**
 * Represents the temperature limits retrieved from MES (now from local API).
 */
export interface TemperatureLimits {
  /**
   * The upper temperature limit in Celsius.
   */
  upperLimitCelsius: number;
  /**
   * The lower temperature limit in Celsius.
   */
  lowerLimitCelsius: number;
}

/**
 * Asynchronously retrieves temperature limits for a given oven by calling the local API.
 *
 * @param ovenId The ID of the oven to retrieve limits for.
 * @returns A promise that resolves to a TemperatureLimits object.
 */
export async function getTemperatureLimits(ovenId: string): Promise<TemperatureLimits> {
  try {
    const response = await fetch(`/api/oven/limits/${ovenId}`);
    if (!response.ok) {
      console.error(`Failed to fetch temperature limits for ${ovenId}: ${response.statusText}`);
      // Return default/fallback limits or throw error
      return { upperLimitCelsius: 250, lowerLimitCelsius: 50 }; // Fallback
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching temperature limits for ${ovenId}:`, error);
    // Return default/fallback limits or throw error
    return { upperLimitCelsius: 250, lowerLimitCelsius: 50 }; // Fallback
  }
}
