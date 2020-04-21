import { ngBoardgameIO } from './boardgameio/ng.js'
import { resistGame } from '../common/game.js'

class DashboardComponent {
  constructor(gameService) {
    this.g = gameService
  }
  get playerIds() {
    return this.g.state.ctx.playOrder
  }
}

class PlayerComponent {
  constructor(gameService) {
    this.g = gameService
  }
  get isThinking() {
    return this.g.isActive(this.playerId)
  }
  get isLeader() {
    return this.g.isCurrentPlayer(this.playerId)
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
