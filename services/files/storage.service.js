const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class Storage extends Model {}

//init here
Storage.init({
    container: {
        type: Sequelize.STRING,
        allowNull: false
    },
    blobName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    blobSize: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    mimeType: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    sequelize: db,
    modelName: 'storage'
});

module.exports = Storage;