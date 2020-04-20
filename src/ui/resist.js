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
  get thinking() {
    return this.playerId in (this.g.state.ctx.activePlayers || {})
  }
  get currentPlayer() {
    return this.playerId == this.g.state.ctx.currentPlayer
  }
}

angular.module('resist', [
  ngBoardgameIO.moduleName,
  ngBoardgameIO.debugModuleName,
])
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
