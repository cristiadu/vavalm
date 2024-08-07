'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Players', 'role', {
      type: Sequelize.ENUM('Initiator', 'Duelist', 'Controller', 'Sentinel', 'Flex', 'IGL'), // Add the new role here
      allowNull: false,
      defaultValue: 'Flex',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Players', 'role', {
      type: Sequelize.ENUM('Initiator', 'Duelist', 'Controller', 'Sentinel', 'Flex'), // Remove the new role here
      allowNull: false,
      defaultValue: 'Flex',
    });
  }
};