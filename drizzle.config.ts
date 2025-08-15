const config = {
    dialect: "postgresql",
    schema: './src/drizzle/schema.ts',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        user: process.env.DATABASE_USER!,
        password: process.env.DATABASE_PASSWORD!,
    },
};

export default config;
