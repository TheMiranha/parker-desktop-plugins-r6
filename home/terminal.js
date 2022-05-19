import { useEffect, useState } from 'react'
import { setFlagsFromString } from 'v8'
import R6stats from '../r6stats/R6stats'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import StarIcon from '@mui/icons-material/Star'
import { DataArray } from '@mui/icons-material'
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import Config from '../config/config.js';

const render = () => {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({})
  const [error, setError] = useState(false)
  const [self, setSelf] = useState(false)
  const [friends, setFriends] = useState([])

  useEffect(() => {
    Config.getConfig(async (r6) => {
        setConfig(r6)
        if (r6.nickname != false) {
            await loadPlayerData(r6.nickname)
            var friends2 = [];
            for (var i = 0; i < r6.friends.length; i++) {
            var data2 = await loadPlayerData(r6.friends[i], false);
            if (data2 != false)
            {
                friends2.push(data2);
            }
            }
            setFriends(friends2);
            setLoading(false)
        } else {
            setLoading(false)
        }
    })
  }, [])

  const loadPlayerData = async (nick, self = true) => {
    if (self) {
      var name = nick || config.nickname
      var data = await R6stats.getGeneralPlayerInfo(name)
      if (data == 'NOT_FOUND') {
        setSelf(false)
        var toSet = { ...config, nickname: false }
        // window.electron.ipcRenderer.sendMessage('appendConfig', { r6: toSet })
        Config.appendConfig(toSet);
        setConfig(toSet)
      } else {
        setSelf(data)
        setLoading(false);
      }
    } else {
      var data = await R6stats.getGeneralPlayerInfo(nick)
      if (data == 'NOT_FOUND') {
        var friends2 = [...config.friends]
        friends2.slice(friends2.indexOf(nick), 1)
        var toSet = { ...config, friends2 }
        setConfig(toSet)
        Config.appendConfig(toSet);
        return false;
      } else {
        return data;
      }
    }
  }

  const register = async name => {
    setLoading(true)
    var player_id = await R6stats.getPlayerID(name)
    if (player_id) {
      var toSet = { ...config, nickname: name }
      setConfig(toSet)
      Config.appendConfig(toSet);
      await loadPlayerData(name);
    } else {
      setLoading(false)
      setError('Não encontrei esse nick')
    }
  }

  const removerAmigo = async (friend) => {
    var friendIndex = friends.findIndex(x => x.general.name == friend);
    var friends2 = [...friends]
    friends2.splice(friendIndex, 1)
    setFriends(friends2);
    var toSet = {...config}
    toSet.friends = toSet.friends.filter(x => x != friend);
    setConfig(toSet);
    Config.appendConfig(toSet);
  }

  const adicionarAmigo = async (friend, data) => {
    var friendIndex = friends.findIndex(x => x.general.name == friend);
    if (friendIndex == -1) {
      setFriends([...friends, data]);
      var toSet = {...config}
      toSet.friends = [...toSet.friends, friend];
      setConfig(toSet);
      Config.appendConfig(toSet);
    }
  }

  return (
    <div
      style={{
        width: 'calc(100vw - 150px)',
        backgroundColor: 'hsl(var(--b2))',
        minHeight: 'calc(100vh - 35px)'
      }}
    >
      {error != false ? (
        <div
          className='alert alert-error shadow-lg'
          style={{ position: 'absolute', bottom: 10, right: 10, width: 500 }}
        >
          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              className='stroke-info flex-shrink-0 w-6 h-6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              ></path>
            </svg>
            <span>{error}</span>
          </div>
          <div className='flex-none'>
            <button
              onClick={() => {
                setError(false)
              }}
              className='btn btn-sm btn-ghost'
            >
              ok
            </button>
          </div>
        </div>
      ) : (
        false
      )}
      {loading == true ? (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <progress className='progress progress-primary w-56'></progress>
        </div>
      ) : config.nickname == false ? (
        <Welcome register={register} />
      ) : (
        <DefaultScreen setError={setError} adicionarAmigo={adicionarAmigo} setLoading={setLoading} removerAmigo={removerAmigo} friends={friends} self={self} config={config} />
      )}
    </div>
  )
}

const Welcome = ({ register }) => {
  const [nickname, setNickname] = useState('')

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <div style={{ width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 25 }}>Percebi que ainda não sei seu nick</p>
        <p>Insira para que eu possa começar</p>
      </div>
      <input
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        style={{ marginTop: 20, textAlign: 'center' }}
        type='text'
        placeholder='Digite seu nick'
        className='input input-bordered w-full max-w-xs'
      />
      <button
        onClick={() => register(nickname)}
        className='btn'
        style={{ marginTop: 20 }}
      >
        Começar
      </button>
    </div>
  )
}

const DefaultScreen = ({ setError,self, config, friends, removerAmigo, setLoading, adicionarAmigo }) => {

  const [terminal, setTerminal] = useState('friends')
  const [term, setTerm] = useState('')
  const [data, setData] = useState(false);

  const search = async() => {
    if (term == self.general.name || term == self.rank.name) {
      setError('Você não pode procurar por você mesmo');
      return;
    }
    var data2 = await R6stats.getGeneralPlayerInfo(term);
    if (data2.general.name == undefined && data2.rank.name == undefined)
    {
      setTerminal('friends');
      setError('Não encontrei ninguem com este nick');
    } else {
      setData(data2);
      setTerminal('search');
    }
  }

  return (
    <div style={{ width: '100%', overflowY: 'scroll', scrollBehavior: 'smooth', height: 'calc(100vh - 35px)'}}>
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          marginTop: 15,
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <p style={{ fontSize: 25 }}>Olá {self.general.name || self.rank.name || self.unranked.name}!</p>
        <div className='indicator'>
          <span className='indicator-item indicator-bottom badge badge-secondary'>
            LVL {self.general.level}
          </span>
          <img
            className='mask mask-squircle'
            src={self.general.header}
            style={{ height: 200, marginTop: 15 }}
          />
        </div>
        <div className='stats shadow' style={{ marginTop: 15 }}>
          <div className='stat'>
            <div className='stat-figure text-secondary'>
              <EmojiEventsIcon />
            </div>
            <div className='stat-title'>Partidas</div>
            <div className='stat-value'>
              {parseInt(self.general.wins) + parseInt(self.general.losses)}
            </div>
            <div className='stat-desc'>
              {self.general.wins} Wins ({self.general.win_})
            </div>
          </div>

          <div className='stat'>
            <div className='stat-figure text-secondary'>
              <img
                src={self.rank.rank_img}
                style={{ marginBottom: 5, height: 75 }}
              />
            </div>
            <div className='stat-title'>Rank</div>
            <div className='stat-value'>{self.rank.rank}</div>
            <div className='stat-desc'>{self.rank.mmr} MMR</div>
          </div>

          <div className='stat'>
            <div className='stat-figure text-secondary'>
              <StarIcon />
            </div>
            <div className='stat-title'>KD Ranked</div>
            <div className='stat-value'>{self.rank.kd} KD</div>
            <div className='stat-desc'>
              {self.rank.kills}K/{self.rank.deaths}D
            </div>
          </div>
        </div>
        <div className='form-control' style={{ marginTop: 25 }}>
          <div className='input-group'>
          {terminal == 'search' ? <button onClick={() => {setTerm('');setData(false); setTerminal('friends')}} className='btn btn-square'>
             <KeyboardBackspaceIcon/>
            </button> : false}
            <input
              value={term}
              onChange={e => setTerm(e.target.value)}
              type='text'
              placeholder='Pesquisa...'
              className='input input-bordered'
            />
            <button onClick={search} className='btn btn-square'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </button>
          </div>
        </div>
        <div className='divider'>{terminal == 'friends' ? 'Seus amigos' : 'Resultados da pesquisa'}</div>
        {terminal == 'friends' ? 
        friends.map(friend => {
          return (
                <div key={friend.general.name} className='indicator' style={{marginBottom: 25}}>
                <span className='indicator-item indicator-bottom badge badge-secondary'>
                  LVL {friend.general.level || friend.rank.level}
                </span>
            <div key={friend} className='card card-side bg-base-100 shadow-xl'>
              <figure>
                <img
                  src={friend.casual.header}
                  style={{ height: 250 }}
                />
              </figure>
              <div className='card-body'>
                <h2 className='card-title'>{friend.casual.name || friend.rank.name}</h2>
                {/* <p>Click the button to watch on Jetflix app.</p> */}
                {friend.general.wins ? <p style={{width: '100%', textAlign: 'initial'}}>
                  Partidas: {parseInt(friend.general.wins) + parseInt(friend.general.losses)}
                </p> : false}
                {friend.rank.rank ? <p style={{width: '100%', textAlign: 'initial'}}>
                  Rank: {friend.rank.rank}
                </p> : false}
                {friend.rank.mmr ? <p style={{width: '100%', textAlign: 'initial'}}>
                  MMR: {friend.rank.mmr}
                </p> : false}
                {friend.rank.kd ? <p style={{width: '100%', textAlign: 'initial'}}>
                  KD: {friend.rank.kd}
                </p> : false}
                <div className='card-actions justify-end'>
                  <button onClick={() => removerAmigo(friend.general.name)}className='btn btn-primary'>Remover amigo</button>
                </div>
                </div>
              </div>
            </div>
          )
        })
      : <div className='indicator' style={{marginBottom: 25}}>
      <span className='indicator-item indicator-bottom badge badge-secondary'>
        LVL {data.general.level || data.rank.level}
      </span>
  <div key={data} className='card card-side bg-base-100 shadow-xl'>
    <figure>
      <img
        src={data.casual.header}
        style={{ height: 250 }}
      />
    </figure>
    <div className='card-body'>
      <h2 className='card-title'>{data.casual.name || data.rank.name}</h2>
      {/* <p>Click the button to watch on Jetflix app.</p> */}
      {data.general.wins ? <p style={{width: '100%', textAlign: 'initial'}}>
        Partidas: {parseInt(data.general.wins) + parseInt(data.general.losses)}
      </p> : false}
      {data.rank.rank ? <p style={{width: '100%', textAlign: 'initial'}}>
        Rank: {data.rank.rank}
      </p> : false}
      {data.rank.mmr ? <p style={{width: '100%', textAlign: 'initial'}}>
        MMR: {data.rank.mmr}
      </p> : false}
      {data.rank.kd ? <p style={{width: '100%', textAlign: 'initial'}}>
        KD: {data.rank.kd}
      </p> : false}
      <div className='card-actions justify-end'>
        <button onClick={() => {
          if (friends.filter(x => x.general.name == data.general.name).length == 0) {
            adicionarAmigo(data.general.name, data)
          } else {
            removerAmigo(data.general.name)
          }
        }}className='btn btn-primary'>{friends.filter(x => x.general.name == data.general.name).length > 0 ? 'Remover amigo' : 'Adicionar amigo'}</button>
      </div>
      </div>
    </div>
  </div>}
      </div>
    </div>
  )
}

const Friend = ({ self }) => {
  return <div>Olá!</div>
}

export default { render }
