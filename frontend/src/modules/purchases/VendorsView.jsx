import React from 'react';
import { useParams } from 'react-router-dom';
import VendorForm from './VendorForm';

const VendorsView = () => {
  const { id } = useParams();
  
  return (
    <VendorForm editId={id} standalone={true} />
  );
};

export default VendorsView;
