import axios from 'axios';
import { appendFileSync } from 'fs';

const ENDPOINT = 'https://parker-servers-r6stats.herokuapp.com';

const getServerStatus = async() => {
    var response = await axios.get(ENDPOINT);
    return response.data.status != undefined;
}

const getPlayerID = async (name, platform = 'pc') => {
    try {
        var response = await axios.get(ENDPOINT + '/api/general/' + platform + '/' + name);
        var id = response.data.header.split('/')[3];
        return id;
    } catch(e) {
        return false;
    }
}

const getGeneralPlayerInfo = async (name, platform = 'pc') => {
    try {
        var all = await axios.get(ENDPOINT + '/api/all/' + platform + '/' + name);
        return all.data;
    }catch (e) {
        return false;
    }
}

module.exports = { getServerStatus, getPlayerID, getGeneralPlayerInfo}
