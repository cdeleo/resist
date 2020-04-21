export const ngBoardgameIO = {
  moduleName: 'bgio',
  debugModuleName: 'bgioDebug',
}

class GameService {
  constructor(game, gameID, playerID, numPlayers, multiplayer, debug, $timeout) {
    this._client = BoardgameIO.Client({
      game,
      gameID,
      playerID,
      numPlayers,
      multiplayer,
      debug,
    })
    if (multiplayer) {
      this._client.subscribe(function () {
        $timeout(() => { }) // Trigger $rootScope update on the next cycle
      })
      this._client.start()
    }
  }
  get state() {
    return this._client.getState()
  }
  get moves() {
    return this._client.moves
  }
  get events() {
    return this._client.events
  }
  get playerID() {
    return this._client.playerID
  }
  updatePlayerID(newPlayerID) {
    this._client.updatePlayerID(newPlayerID)
  }
}

class DebugComponentController {
  constructor(gameService, gameState, gameContext) {
    this.gameService = gameService
    this.gameState = gameState
    this.gameContext = gameContext
    this.moveArgs = ''
    this.evtArgs = ''
  }

  updatePlayerID(playerID) {
    this.gameService.updatePlayerID(playerID)
  }

  get moveNames() {
    return Object.keys(this.gameService.moves)
  }

  get eventNames() {
    return Object.keys(this.gameService.events)
  }

  makeMove(moveName) {
    try {
      this._execute(this.gameService.moves[moveName], this.moveArgs)
    } catch (e) {
      this._createLogEntry('ERROR', `BadMove: ${moveName}`, this.moveArgs)
    }
  }

  triggerEvent(eventName) {
    try {
      this._execute(this.gameService.moves[eventName], this.evtArgs)
    } catch (e) {
      this._createLogEntry('ERROR', `BadEvent: ${eventName}`, this.eventArgs)
    }
  }

  /** Parses [argsAsJsonArrayString] and then dynamically applies the result to a fn. */
  _execute(fn, argsAsJsonArrayString) {
    fn.apply(null, JSON.parse(`[${argsAsJsonArrayString}]`))
  }

  _createLogEntry(type, payloadType, args) {
    this.client.log.push({
      action: {
        type,
        payload: {
          playerID: this.client.playerID,
          type: payloadType,
          args
        }
      }
    })
  }
}

class LogEntryComponentController {
  get actionType() {
    return this.value.action.type
  }
  get playerID() {
    return this.value.action.payload.playerID
  }
  get action() {
    return this.value.action.payload.type
  }
  get args() {
    return this.value.action.payload.args
  }
}

class GameState {
  constructor(gameService) {
    this._gameService = gameService
  }
  get _state() {
    return this._gameService.state
  }
  get ctx() {
    return this._state ? this._state.ctx : {}
  }
  get G() {
    return this._state ? this._state.G : {}
  }
  get log() {
    return this._state ? this._state.log : []
  }
  get ready() {
    return Boolean(this._state)
  }
}

class GameContext {
  constructor(gameState) {
    this._gameState = gameState
  }
  get ctx() {
    return this._gameState.ctx
  }
  get playOrder() {
    return this.ctx.playOrder
  }
  isActive(playerId) {
    return playerId in (this.ctx.activePlayers || {})
  }
  isCurrentPlayer(playerId) {
    return playerId == this.ctx.currentPlayer
  }
}

angular.module(ngBoardgameIO.moduleName, [])
  .constant('gameID', undefined)
  .constant('playerID', undefined)
  .constant('numPlayers', 2)
  .constant('multiplayer', false)
  .constant('debug', false)
  .service('gameService', GameService)
  .service('gameState', GameState)
  .service('gameContext', GameContext)

angular.module(ngBoardgameIO.debugModuleName, [ngBoardgameIO.moduleName])
  .component('bgioDebug', {
    'controller': DebugComponentController,
    'templateUrl': 'boardgameio/tpl/debug.ng.html'
  })
  .component('bgioLogEntry', {
    'templateUrl': 'boardgameio/tpl/log-entry.ng.html',
    'controller': LogEntryComponentController,
    'bindings': {
      'value': '<'
    },
  })

