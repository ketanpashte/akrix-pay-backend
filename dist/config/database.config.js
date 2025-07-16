"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const entities_1 = require("../entities");
const getDatabaseConfig = (configService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    entities: [entities_1.User, entities_1.Payment, entities_1.Receipt, entities_1.Admin],
    synchronize: true,
    logging: true,
    ssl: { rejectUnauthorized: false },
    extra: {
        ssl: {
            rejectUnauthorized: false,
        },
    },
});
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map