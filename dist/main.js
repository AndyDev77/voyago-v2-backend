"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const express = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: false,
    });
    app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
    app.use((req, res, next) => {
        if (req.path === '/api/webhooks/stripe') {
            return next();
        }
        express.json()(req, res, next);
    });
    app.use((req, res, next) => {
        if (req.path === '/api/webhooks/stripe') {
            return next();
        }
        express.urlencoded({ extended: true })(req, res, next);
    });
    app.setGlobalPrefix('api');
    app.enableCors({ origin: '*' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    const port = process.env.PORT || 8001;
    await app.listen(port);
    console.log(`Voyago API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map