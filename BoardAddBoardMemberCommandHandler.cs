
  using EventFlow.Commands;
  using Statsh.Domain.Board.Commands;
  using Statsh.EventFlow.Commands;
  using System.Threading;
  using System.Threading.Tasks;
  
  namespace Statsh.Domain.TT.CommandHandlers
  {
      public sealed class BoardAddBoardMemberCommandHandler : CommandHandler<BoardAggregate, BoardRef, CommandExecutionResult, BoardAddBoardMemberCommand>
      {
          public override Task<CommandExecutionResult> ExecuteCommandAsync(
              BoardAggregate aggregate,
              BoardAddBoardMemberCommand command,
              CancellationToken cancellationToken)
          {
              var executionResult = aggregate.AddBoardMember(command);
              return executionResult;
          }
      }
  }
    
