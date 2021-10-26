
using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace Statsh.Domain.TT.Events
{
    [EventVersion("BoardTagPropertyOptionsResetted", 1)]
    public class BoardTagPropertyOptionsResettedEvent : IAggregateEvent<BoardAggregate, BoardRef>
    {
        
    }
}
  
