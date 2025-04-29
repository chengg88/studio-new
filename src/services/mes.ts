/**
 * Represents the temperature limits retrieved from MES.
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
 * Asynchronously retrieves temperature limits for a given oven.
 *
 * @param ovenId The ID of the oven to retrieve limits for.
 * @returns A promise that resolves to a TemperatureLimits object.
 */
export async function getTemperatureLimits(ovenId: string): Promise<TemperatureLimits> {
  // TODO: Implement this by calling an API.
  return {
    upperLimitCelsius: 250,
    lowerLimitCelsius: 50,
  };
}
