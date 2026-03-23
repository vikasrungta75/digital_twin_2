import { useMemo } from 'react';

export function useFilteredVehicles(vehiclesLocationv : any[], searchInputGeneral: any) {
  const filteredVehicles = useMemo(() => {
    return vehiclesLocationv?.filter((obj) => {
      return Object.keys(obj).some((key) => {
        return obj.vin?.toUpperCase().includes(searchInputGeneral.toUpperCase());
      });
    });
  }, [searchInputGeneral, vehiclesLocationv]);

  return filteredVehicles;
}