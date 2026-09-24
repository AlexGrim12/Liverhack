-- El Hiring Manager ya no puede cancelar (cerrar) vacantes: solo el BP (HRBP) las cierra o cancela.
-- Aplica a bases que ya corrieron la migración inicial; el resto de las transiciones no cambia.
update public.stage_transitions
   set roles = '{hrbp}'
 where hacia = 'cerrada';
