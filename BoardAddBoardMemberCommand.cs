
using Statsh.Attributes;
using Statsh.EventFlow.Commands;

namespace Statsh.Domain.TT.Commands
{
    public class BoardAddBoardMemberCommand : ClientSideCommand<BoardAggregate, BoardRef>
    {
        public BoardAddBoardMemberCommand(BoardRef id, ClientSideCommandRef? commandId): base(id, commandId)
        {
        }
        
    }
}
    