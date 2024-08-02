'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Teams', 'logo_url', 'logo_image_file')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Teams', 'logo_image_file', 'logo_url')
  },
}
