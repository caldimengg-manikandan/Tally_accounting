module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    bloodGroup: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fatherName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    motherName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    maritalStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfJoining: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    personalEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    workEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContactRelationship: {
      type: DataTypes.STRING,
      allowNull: true
    },
    presentAddressLine1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    presentAddressLine2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    presentAddressCity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    presentAddressState: {
      type: DataTypes.STRING,
      allowNull: true
    },
    presentAddressCountry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    presentAddressZip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sameAsPresentAddress: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    permanentAddressLine1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    permanentAddressLine2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    permanentAddressCity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    permanentAddressState: {
      type: DataTypes.STRING,
      allowNull: true
    },
    permanentAddressCountry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    permanentAddressZip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    workLocation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    employmentType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isDirector: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    portalAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    aadhaarNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankAccountType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankBranchName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ifscCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pfNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    esiNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pranNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    highestQualification: {
      type: DataTypes.STRING,
      allowNull: true
    },
    universityCollege: {
      type: DataTypes.STRING,
      allowNull: true
    },
    yearOfPassing: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    previousCompany: {
      type: DataTypes.STRING,
      allowNull: true
    },
    previousExperience: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Resigned'),
      defaultValue: 'Active'
    },
    resignationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    isDraft: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Companies',
        key: 'id'
      }
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    paranoid: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['CompanyId', 'workEmail']
      }
    ]
  });

  return Employee;
};
