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

  get state() {
    return this.client.getState()
  }
  isActive(playerId) {
    return playerId in (this.state.ctx.activePlayers || {})
  }
  isCurrentPlayer(playerId) {
    return playerId == this.state.ctx.currentPlayer
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
    this._execute(this.client.moves[moveName], this.moveArgs)
  }

  triggerEvent(eventName) {
    this._execute(this.client.events[eventName], this.evtArgs)
  }

  /** Parses [argsAsJsonArrayString] and then dynamically applies the result to a fn. */
  _execute(fn, argsAsJsonArrayString) {
    fn.apply(null, JSON.parse(`[${argsAsJsonArrayString}]`))
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

angular.module(ngBoardgameIO.moduleName, [])
  .constant('gameID', undefined)
  .constant('playerID', undefined)
  .constant('numPlayers', 2)
  .constant('multiplayer', false)
  .constant('debug', false)
  .service('gameService', GameService)

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

