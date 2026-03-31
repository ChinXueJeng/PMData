import React, { createContext, useContext, useState } from 'react';

type Brand = 'TOTO' | 'MAGNUM';

interface BrandContextType {
  selectedBrand: Brand;
  setSelectedBrand: (brand: Brand) => void;
}

const BrandContext = createContext<BrandContextType>({
  selectedBrand: 'TOTO',
  setSelectedBrand: () => {},
});

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBrand, setSelectedBrand] = useState<Brand>('TOTO');
  return (
    <BrandContext.Provider value={{ selectedBrand, setSelectedBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);