module.exports = {
    apps: [
    {
        name: 'fhir-burni',
        script: 'server.js',
        node_args: ["--inspect"],
        watch: false,
        exec_mode: 'cluster',
        instances: 2,
        max_memory_restart: '4G',
        time: true,
        log_date_format: 'YYYY-MM-DD HH:mm Z',
        force: true,
        wait_ready: false,
        max_restarts: 10,
        autorestart: true,
        error_file: './pm2log/err.log',
        out_file: './pm2log/out.log',
        log_file: './pm2log/log.log'
    }]
};