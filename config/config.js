import { useEffect, useState } from "react";

const setConfig = (config) => {
    window.electron.ipcRenderer.sendMessage('setPluginConfig', {plugin: 'r6', config});
}

const appendConfig = (config) => {
    window.electron.ipcRenderer.sendMessage('appendPluginConfig', {plugin: 'r6', toSet: config});
}

const getConfig = (callBack) => {
    window.electron.ipcRenderer.once('getPluginConfig', config => {
        callBack(config);
    });
    window.electron.ipcRenderer.sendMessage('getPluginConfig', {plugin: 'r6'});
}


const RENDER_CONFIG = true;
const RENDER_TITLE = 'Rainbow Six';

const render = () => {

    const [nickName, setNickName] = useState('');

    useEffect(() => {
        getConfig(config => {
            setNickName(config.nickname);
        })
    }, [])

    const saveConfig = () => {
        appendConfig({nickname: nickName});
    }

    return (
        <div>
            <div>
            Nickname:
            <input
              style={{ marginLeft: 10 }}
              value={nickName == false ? '' : nickName}
              onChange={(e) => setNickName(e.target.value)}
              type='text'
              placeholder='Digite um nickname...'
              className='input input-bordered w-full max-w-xs'
            />
          </div>
          <button className="btn btn-outline btn-success" onClick={saveConfig} style={{marginTop: 20}}>Salvar</button>
        </div>
    )
}


export default { setConfig, appendConfig, getConfig, render, RENDER_CONFIG, RENDER_TITLE }