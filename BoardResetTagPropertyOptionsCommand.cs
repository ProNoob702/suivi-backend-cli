
using Statsh.Attributes;
using Statsh.EventFlow.Commands;

namespace Statsh.Domain.TT.Commands
{
    public class BoardResetTagPropertyOptionsCommand : ClientSideCommand<BoardAggregate, BoardRef>
    {
        public BoardResetTagPropertyOptionsCommand(BoardRef id, ClientSideCommandRef? commandId): base(id, commandId)
        {
        }
        
    }
}
    