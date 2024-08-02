'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Teams', 'logo_url_temp', {
      type: Sequelize.BLOB,
      allowNull: true,
    })

    // Remove the old column
    await queryInterface.removeColumn('Teams', 'logo_url')

    // Rename the temporary column to the original column name
    await queryInterface.renameColumn('Teams', 'logo_url_temp', 'logo_url')
  },

  async down (queryInterface, Sequelize) {
    // Add the old column back
    await queryInterface.addColumn('Teams', 'logo_url_old', {
      type: Sequelize.STRING,
      allowNull: true,
    })

    // Remove the new column
    await queryInterface.removeColumn('Teams', 'logo_url')

    // Rename the old column back to the original column name
    await queryInterface.renameColumn('Teams', 'logo_url_old', 'logo_url')
  },
}
