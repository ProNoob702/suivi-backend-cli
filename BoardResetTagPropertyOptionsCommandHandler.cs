
  using EventFlow.Commands;
  using Statsh.Domain.Board.Commands;
  using Statsh.EventFlow.Commands;
  using System.Threading;
  using System.Threading.Tasks;
  
  namespace Statsh.Domain.TT.CommandHandlers
  {
      public sealed class BoardResetTagPropertyOptionsCommandHandler : CommandHandler<BoardAggregate, BoardRef, CommandExecutionResult, BoardResetTagPropertyOptionsCommand>
      {
          public override Task<CommandExecutionResult> ExecuteCommandAsync(
              BoardAggregate aggregate,
              BoardResetTagPropertyOptionsCommand command,
              CancellationToken cancellationToken)
          {
              var executionResult = aggregate.ResetTagPropertyOptions(command);
              return executionResult;
          }
      }
  }
    
