import AsyncStorage from '@react-native-async-storage/async-storage';

class Logger {
    constructor() {
        this.logs = [];
        this.sessionId = Date.now();
        this.maxLogs = 500;
        this.cleanup();
    }

    log(action, data = null, type = 'INFO') {
        const entry = {
            time: new Date().toISOString(),
            type,
            action,
            data,
        };

        this.logs.push(entry);

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        if (__DEV__) {
            console.log(`[${type}] ${action}`, data || '');
        }

        if (this.logs.length % 20 === 0) {
            this.save();
        }
    }

    logSpotData(spot, context = '') {
        this.log('spot_data', {
            context,
            id: spot?.id,
            spot_type: spot?.spot_type,
            address: spot?.address,
            distance: spot?.distance,
        }, 'SPOT_DATA');
    }

    async save() {
        try {
            const key = `parkaid_logs_${this.sessionId}`;
            await AsyncStorage.setItem(key, JSON.stringify(this.logs));
        } catch (e) {
            // silent fail
        }
    }

    async cleanup() {
        try {
            const prev = await AsyncStorage.getItem('parkaid_log_session');
            if (prev && prev !== this.sessionId.toString()) {
                await AsyncStorage.removeItem(`parkaid_logs_${prev}`);
            }
            await AsyncStorage.setItem('parkaid_log_session', this.sessionId.toString());
        } catch (e) {
            // silent fail
        }
    }

    getLogs() {
        return this.logs;
    }

    clear() {
        this.logs = [];
    }
}

const logger = new Logger();
export default logger;
export { logger };

