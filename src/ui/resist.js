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
  get currentStage() {
    return this._gameContext.currentStage
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

class TeamPickComponent {
  constructor(resist) {
    this._resist = resist
    this.teamSize = resist.currentMissionTeamSize
    this.players = resist.players
    this.team = new Set()
  }
  pick(playerID) {
    if (this.team.has(playerID)) {
      this.team.delete(playerID)
    } else if (this.team.size < this.teamSize) {
      this.team.add(playerID)
    }
  }
  submit() {
    this._resist.proposeTeam(Array.from(this.team))
  }
}

class VoteTeamComponent {
  constructor(resist) {
    this._resist = resist
  }
  voteYay() {

  }
  voteNay() {

  }
}

class Resist {
  constructor(gameState, gameContext, gameService) {
    this._gameState = gameState
    this._gameContext = gameContext
    this._gameService = gameService
  }
  get currentMissionTeamSize() {
    return this._gameState.G.missionProgression[this._gameState.G.missionResults.length].size
  }
  get players() {
    return this._gameContext.playOrder
  }
  proposeTeam(team) {
    this._gameService.moves.proposeTeam(team)
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
  .service('resist', Resist)
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
  .component('reTeamPick', {
    'controller': TeamPickComponent,
    'templateUrl': 'tpl/team-pick.ng.html',
  })
  .component('reVoteTeam', {
    'controller': VoteTeamComponent,
    'templateUrl': 'tpl/vote-team.ng.html',
  })
angular.bootstrap(document.body, ['resist'])
