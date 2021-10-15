
using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace Statsh.Domain.TT.Events
{
    [EventVersion("BoardBoardMemberAdded", 1)]
    public class BoardBoardMemberAddedEvent : IAggregateEvent<BoardAggregate, BoardRef>
    {
        
    }
}
  
