import { supabase } from "../supabase";

export const updateKennelStatus = async (sourceId, destinationId) => {
  const { data: sourceKennel, error: sourceError } = await supabase
    .from("kennels")
    .select("status")
    .eq("id", sourceId)
    .single();

  if (sourceError) throw sourceError;

  const { error: updateSourceError } = await supabase
    .from("kennels")
    .update({ status: "available" })
    .eq("id", sourceId);

  if (updateSourceError) throw updateSourceError;

  const { error: updateDestinationError } = await supabase
    .from("kennels")
    .update({ status: sourceKennel.status })
    .eq("id", destinationId);

  if (updateDestinationError) throw updateDestinationError;
};

export const updatePetInformation = async (sourceId, destinationId) => {
  const { error: updateError } = await supabase
    .from("pet_information")
    .update({ kennel_id: destinationId })
    .eq("kennel_id", sourceId);

  if (updateError) throw updateError;
};

export const updateReservation = async (sourceId, destinationId) => {
  const { data: reservations, error: fetchError } = await supabase
    .from("reservations")
    .select("id, kennel_ids, kennel_numbers")
    .contains("kennel_ids", [sourceId]);

  if (fetchError) throw fetchError;

  for (const reservation of reservations) {
    const updatedKennelIds = reservation.kennel_ids.map(id =>
      id === sourceId ? destinationId : id
    );

    const updatedKennelNumbers = { ...reservation.kennel_numbers };
    updatedKennelNumbers[destinationId] = updatedKennelNumbers[sourceId];
    delete updatedKennelNumbers[sourceId];

    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        kennel_ids: updatedKennelIds,
        kennel_numbers: updatedKennelNumbers,
      })
      .eq("id", reservation.id);

    if (updateError) throw updateError;
  }
};

export const updateFeedingSchedule = async (sourceId, destinationId) => {
  const { error: updateError } = await supabase
    .from("feeding_schedule")
    .update({ kennel_id: destinationId })
    .eq("kennel_id", sourceId);

  if (updateError) throw updateError;
};
