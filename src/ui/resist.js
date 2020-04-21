import { ngBoardgameIO } from './boardgameio/ng.js'

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
  .constant('multiplayer', BoardgameIO.Local())
  .constant('game', {
    'setup': () => ({ cells: Array(9).fill(null) }),
    'moves': {
      clickCell(G, ctx, id) {
        G.cells[id] = ctx.currentPlayer
      },
    },
  })
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
