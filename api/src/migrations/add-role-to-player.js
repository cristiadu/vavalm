'use strict';

const PlayerRole = {
    Initiator: 'Initiator',
    Duelist: 'Duelist',
    Controller: 'Controller',
    Sentinel: 'Sentinel',
    Flex: 'Flex',
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Players', 'role', {
      type: Sequelize.ENUM(...Object.values(PlayerRole)),
      allowNull: false,
      defaultValue: PlayerRole.Flex,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Players', 'role');
  }
};
