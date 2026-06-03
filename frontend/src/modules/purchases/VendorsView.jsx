import React from 'react';
import { useParams } from 'react-router-dom';
import VendorForm from './VendorForm';

const VendorsView = ({ companyId }) => {
  const { id } = useParams();
  
  return (
    <VendorForm editId={id} standalone={true} companyId={companyId} />
  );
};

export default VendorsView;
