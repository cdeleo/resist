import { ngBoardgameIO } from './boardgameio/ng.js'
import { resistGame } from '../common/game.js'

class DashboardComponent {
  constructor(gameContext, gameState) {
    this._gameContext = gameContext
    this._gameState = gameState
  }
  get ready() {
    return this._gameState.ready
  }
  get playerIds() {
    return this._gameContext.playOrder
  }
}

class PlayerComponent {
  constructor(gameContext) {
    this._gameContext = gameContext
  }
  get isThinking() {
    return this._gameContext.isActive(this.playerId)
  }
  get isLeader() {
    return this._gameContext.isCurrentPlayer(this.playerId)
  }
}

angular.module('resist', [
  ngBoardgameIO.moduleName,
  ngBoardgameIO.debugModuleName,
])
  .constant('gameID', 'default')
  .constant('playerID', '1')
  .constant('numPlayers', 5)
  .constant('multiplayer', BoardgameIO.Local())
  .constant('game', resistGame())
  .component('reDash', {
    'controller': DashboardComponent,
    'templateUrl': 'tpl/dashboard.ng.html',
  })
  .component('rePlayer', {
    'controller': PlayerComponent,
    'templateUrl': 'tpl/player.ng.html',
    'bindings': {
      'playerId': '<',
    },
  })
angular.bootstrap(document.body, ['resist'])
