export const ngBoardgameIO = {
  moduleName: 'bgio',
  debugModuleName: 'bgioDebug',
}

class GameService {
  constructor(game, gameID, playerID, numPlayers, multiplayer, debug, $timeout) {
    this.client = BoardgameIO.Client({
      game,
      gameID,
      playerID,
      numPlayers,
      multiplayer,
      debug,
    })
    if (multiplayer) {
      this.client.subscribe(function () {
        $timeout(() => { }) // Trigger $rootScope update on the next cycle
      })
      this.client.start()
    }
  }
}

class DebugComponentController {
  constructor(gameService) {
    this.client = gameService.client
    this.moveArgs = ''
    this.evtArgs = ''
  }

  updatePlayerID(playerID) {
    this.client.updatePlayerID(playerID)
  }

  get moveNames() {
    return Object.keys(this.client.moves)
  }

  get eventNames() {
    return Object.keys(this.client.events)
  }

  makeMove(moveName) {
    try {
      this._execute(this.client.moves[moveName], this.moveArgs)
    } catch (e) {
      this._createLogEntry('ERROR', `BadMove: ${moveName}`, this.moveArgs)
    }
  }

  triggerEvent(eventName) {
    try {
      this._execute(this.client.events[eventName], this.evtArgs)
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
    this._client = gameService.client
  }
  get G() {
    return this._client.getState().G
  }
  get ready() {
    return Boolean(this._client.getState())
  }
}

class GameContext {
  constructor(gameService) {
    this._client = gameService.client
  }
  get ctx() {
    return this._client.getState().ctx
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

